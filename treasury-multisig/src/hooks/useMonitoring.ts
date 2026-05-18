// src/hooks/useMonitoring.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  GOVERNOR_ABI,
  TREASURY_ABI,
  REGISTRY_ABI,
  GAS_REFILLER_ABI,
} from "@/lib/abi";

export interface ContractStatus {
  name: string;
  address: string;
  balance: number;
  isDeployed: boolean;
  isPaused: boolean | null;
  lastEventBlock: number;
  eventCount24h: number;
}

const ALL_CONTRACTS: {
  name: string;
  key: keyof typeof CONTRACT_ADDRESSES;
  hasPause: boolean;
}[] = [
  { name: "VariableTimelock", key: "VARIABLE_TIMELOCK", hasPause: false },
  { name: "GovernanceToken", key: "GOVERNANCE_TOKEN", hasPause: false },
  { name: "UpgradeGovernor", key: "UPGRADE_GOVERNOR", hasPause: false },
  { name: "ValidatorRegistry", key: "VALIDATOR_REGISTRY", hasPause: false },
  { name: "TreasuryController", key: "TREASURY_CONTROLLER", hasPause: true },
  { name: "GasRefiller", key: "GAS_REFILLER", hasPause: false },
];

export function useContractStatuses() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["contractStatuses"],
    queryFn: async (): Promise<ContractStatus[]> => {
      if (!publicClient) return [];

      const results: ContractStatus[] = [];

      for (const contract of ALL_CONTRACTS) {
        const address = CONTRACT_ADDRESSES[contract.key] as `0x${string}`;
        if (address === "0x") {
          results.push({
            name: contract.name,
            address,
            balance: 0,
            isDeployed: false,
            isPaused: null,
            lastEventBlock: 0,
            eventCount24h: 0,
          });
          continue;
        }

        let balance = 0;
        let isDeployed = false;
        let isPaused: boolean | null = null;

        try {
          const code = await publicClient.getCode({ address });
          isDeployed = !!code && code !== "0x";
        } catch {
          isDeployed = false;
        }

        try {
          const raw = await publicClient.getBalance({ address });
          balance = Number(formatUnits(raw, 18));
        } catch {}

        if (contract.hasPause && isDeployed) {
          try {
            const paused = await publicClient.readContract({
              address,
              abi: TREASURY_ABI,
              functionName: "paused",
            });
            isPaused = paused as boolean;
          } catch {
            isPaused = null;
          }
        }

        // Count recent events (last ~5000 blocks ≈ ~6h on Polygon)
        let eventCount24h = 0;
        let lastEventBlock = 0;
        try {
          const currentBlock = await publicClient.getBlockNumber();
          const fromBlock = currentBlock > 5000n ? currentBlock - 5000n : 0n;
          const logs = await publicClient.getLogs({
            address,
            fromBlock,
            toBlock: currentBlock,
          });
          eventCount24h = logs.length;
          if (logs.length > 0) {
            lastEventBlock = Number(logs[logs.length - 1].blockNumber ?? 0);
          }
        } catch {}

        results.push({
          name: contract.name,
          address,
          balance,
          isDeployed,
          isPaused,
          lastEventBlock,
          eventCount24h,
        });
      }

      return results;
    },
    refetchInterval: 30000,
  });
}

export function useContractDetail(address: string) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["contractDetail", address],
    queryFn: async () => {
      if (!publicClient || !address || address === "0x") {
        return { balance: 0, code: "", events: [], isDeployed: false };
      }

      const addr = address as `0x${string}`;

      let balance = 0;
      let isDeployed = false;

      try {
        const code = await publicClient.getCode({ address: addr });
        isDeployed = !!code && code !== "0x";
      } catch {}

      try {
        const raw = await publicClient.getBalance({ address: addr });
        balance = Number(formatUnits(raw, 18));
      } catch {}

      // Fetch last 100 events
      let events: { blockNumber: number; transactionHash: string; logIndex: number; data: string }[] = [];
      try {
        const currentBlock = await publicClient.getBlockNumber();
        const fromBlock = currentBlock > 10000n ? currentBlock - 10000n : 0n;
        const logs = await publicClient.getLogs({
          address: addr,
          fromBlock,
          toBlock: currentBlock,
        });
        events = logs.slice(-100).map((l) => ({
          blockNumber: Number(l.blockNumber ?? 0),
          transactionHash: l.transactionHash ?? "0x",
          logIndex: Number(l.logIndex ?? 0),
          data: l.data ?? "0x",
        }));
      } catch {}

      return { balance, isDeployed, events };
    },
    enabled: !!address && address !== "0x",
    refetchInterval: 30000,
  });
}

export function useSystemHealth() {
  const { data: statuses } = useContractStatuses();

  const totalContracts = statuses?.length ?? 0;
  const deployed = statuses?.filter((s) => s.isDeployed).length ?? 0;
  const totalGas = statuses?.reduce((sum, s) => sum + s.balance, 0) ?? 0;
  const totalEvents = statuses?.reduce((sum, s) => sum + s.eventCount24h, 0) ?? 0;
  const pausedContracts = statuses?.filter((s) => s.isPaused === true).length ?? 0;
  const criticalGas = statuses?.filter((s) => s.isDeployed && s.balance < 0.5).length ?? 0;

  return {
    totalContracts,
    deployed,
    totalGas,
    totalEvents,
    pausedContracts,
    criticalGas,
    healthScore:
      totalContracts > 0
        ? Math.round(
            ((deployed - pausedContracts - criticalGas) / totalContracts) * 100
          )
        : 0,
  };
}
