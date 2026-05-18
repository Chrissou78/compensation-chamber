// src/hooks/useAdmin.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { getContractConfig } from "@/lib/contract";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { GOVERNOR_ABI, REGISTRY_ABI, TEST_TOKEN_ABI } from "@/lib/abi";
import { useValidators, useValidatorCount } from "@/hooks/useValidators";

// ─── Token supply info ──────────────────────────────────────
export function useTokenSupply() {
  const publicClient = usePublicClient();
  const config = getContractConfig("governor");

  return useQuery({
    queryKey: ["tokenSupply"],
    queryFn: async () => {
      if (!publicClient) return { totalMinted: 0, maxSupply: 1_000_000, circulatingPct: 0 };

      const governanceToken = CONTRACT_ADDRESSES.GOVERNANCE_TOKEN as `0x${string}`;
      if (governanceToken === "0x") {
        return { totalMinted: 0, maxSupply: 1_000_000, circulatingPct: 0 };
      }

      try {
        const [totalSupplyRaw, decimals] = await Promise.all([
          publicClient.readContract({
            address: governanceToken,
            abi: [
              { type: "function", name: "totalSupply", inputs: [], outputs: [{ type: "uint256" }], stateMutability: "view" },
            ],
            functionName: "totalSupply",
          }),
          publicClient.readContract({
            address: governanceToken,
            abi: [
              { type: "function", name: "decimals", inputs: [], outputs: [{ type: "uint8" }], stateMutability: "view" },
            ],
            functionName: "decimals",
          }),
        ]);

        const totalMinted = Number(formatUnits(totalSupplyRaw as bigint, Number(decimals)));
        const maxSupply = 1_000_000;
        return {
          totalMinted,
          maxSupply,
          circulatingPct: maxSupply > 0 ? (totalMinted / maxSupply) * 100 : 0,
        };
      } catch {
        return { totalMinted: 0, maxSupply: 1_000_000, circulatingPct: 0 };
      }
    },
    refetchInterval: 60000,
  });
}

// ─── Blacklisted addresses ──────────────────────────────────
export function useBlacklist() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["blacklist"],
    queryFn: async () => {
      // Blacklist events from GovernanceTokenV2
      if (!publicClient) return [];

      const tokenAddress = CONTRACT_ADDRESSES.GOVERNANCE_TOKEN as `0x${string}`;
      if (tokenAddress === "0x") return [];

      try {
        const logs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: "event",
            name: "Blacklisted",
            inputs: [
              { type: "address", name: "account", indexed: true },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        });

        const removedLogs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: "event",
            name: "RemovedFromBlacklist",
            inputs: [
              { type: "address", name: "account", indexed: true },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        });

        const blacklisted = new Set(logs.map((l) => (l.args as { account: string }).account));
        for (const r of removedLogs) {
          blacklisted.delete((r.args as { account: string }).account);
        }

        return Array.from(blacklisted).map((addr) => ({
          address: addr,
          blacklistedAt: Date.now(), // approximate since we don't have timestamps in logs easily
        }));
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}

// ─── Mint requests (events from GovernanceTokenV2) ──────────
export function useMintHistory() {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["mintHistory"],
    queryFn: async () => {
      if (!publicClient) return [];

      const tokenAddress = CONTRACT_ADDRESSES.GOVERNANCE_TOKEN as `0x${string}`;
      if (tokenAddress === "0x") return [];

      try {
        const logs = await publicClient.getLogs({
          address: tokenAddress,
          event: {
            type: "event",
            name: "Transfer",
            inputs: [
              { type: "address", name: "from", indexed: true },
              { type: "address", name: "to", indexed: true },
              { type: "uint256", name: "value" },
            ],
          },
          fromBlock: 0n,
          toBlock: "latest",
        });

        // Mints are transfers from 0x0
        const mints = logs
          .filter((l) => {
            const args = l.args as { from: string; to: string; value: bigint };
            return args.from === "0x0000000000000000000000000000000000000000";
          })
          .map((l, i) => {
            const args = l.args as { from: string; to: string; value: bigint };
            return {
              id: `mint-${i}`,
              to: args.to,
              amount: Number(formatUnits(args.value, 18)),
              blockNumber: Number(l.blockNumber ?? 0),
              txHash: l.transactionHash ?? "0x",
            };
          });

        return mints.reverse(); // newest first
      } catch {
        return [];
      }
    },
    refetchInterval: 60000,
  });
}

// ─── Admin overview stats ───────────────────────────────────
export function useAdminOverview() {
  const { data: supply } = useTokenSupply();
  const { total, active, blacklisted } = useValidatorCount();
  const { data: blacklist } = useBlacklist();
  const { data: mints } = useMintHistory();

  return {
    totalMinted: supply?.totalMinted ?? 0,
    maxSupply: supply?.maxSupply ?? 1_000_000,
    circulatingPct: supply?.circulatingPct ?? 0,
    validatorsTotal: total,
    validatorsActive: active,
    validatorsBlacklisted: blacklisted,
    blacklistedAddresses: blacklist?.length ?? 0,
    recentMints: mints?.slice(0, 10) ?? [],
  };
}
