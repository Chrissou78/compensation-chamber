// src/hooks/useEvents.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { type Address, formatUnits, parseAbiItem } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  GOVERNOR_ABI,
  TREASURY_ABI,
  REGISTRY_ABI,
  GAS_REFILLER_ABI,
} from "@/lib/abi";

export interface ContractEvent {
  id: string;
  contractName: string;
  eventName: string;
  args: Record<string, unknown>;
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  timestamp?: number;
}

const EVENT_SOURCES: {
  name: string;
  addressKey: keyof typeof CONTRACT_ADDRESSES;
  abi: readonly unknown[];
  events: string[];
}[] = [
  {
    name: "Governor",
    addressKey: "UPGRADE_GOVERNOR",
    abi: GOVERNOR_ABI,
    events: [
      "ProposalCreatedWithSeverity",
      "ThresholdReached",
      "ProposalReadyForExecution",
      "ProposalExecutedWithCooldown",
    ],
  },
  {
    name: "Treasury",
    addressKey: "TREASURY_CONTROLLER",
    abi: TREASURY_ABI,
    events: ["OrderExecuted", "AgentAuthorized", "AgentRevoked", "Paused", "Unpaused"],
  },
  {
    name: "Registry",
    addressKey: "VALIDATOR_REGISTRY",
    abi: REGISTRY_ABI,
    events: ["ValidatorAdded", "ValidatorRemoved", "ValidatorStatusChanged", "ThresholdUpdated"],
  },
  {
    name: "GasRefiller",
    addressKey: "GAS_REFILLER",
    abi: GAS_REFILLER_ABI,
    events: ["ContractRefilled", "FeesSwapped", "WalletAdded", "WalletRemoved"],
  },
];

export function useRecentEvents(blockRange = 5000n) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["recentEvents", blockRange.toString()],
    queryFn: async (): Promise<ContractEvent[]> => {
      if (!publicClient) return [];

      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > blockRange ? currentBlock - blockRange : 0n;

      const allEvents: ContractEvent[] = [];

      for (const source of EVENT_SOURCES) {
        const address = CONTRACT_ADDRESSES[source.addressKey] as Address;
        if (address === "0x") continue;

        try {
          const logs = await publicClient.getLogs({
            address,
            fromBlock,
            toBlock: currentBlock,
          });

          for (const log of logs) {
            // Try to decode with ABI
            try {
              const { eventName, args } = (() => {
                // Get event ABIs from the source ABI
                const eventAbis = (source.abi as any[]).filter(
                  (item: any) => item.type === "event"
                );

                for (const eventAbi of eventAbis) {
                  try {
                    const parsed = parseAbiItem(
                      `event ${eventAbi.name}(${eventAbi.inputs
                        .map((i: any) => `${i.type}${i.indexed ? " indexed" : ""} ${i.name}`)
                        .join(", ")})`
                    );

                    // Use viem's decodeEventLog if topic matches
                    const { decodeEventLog } = require("viem");
                    const decoded = decodeEventLog({
                      abi: [eventAbi],
                      data: log.data,
                      topics: log.topics,
                    });

                    return {
                      eventName: decoded.eventName as string,
                      args: (decoded.args || {}) as Record<string, unknown>,
                    };
                  } catch {
                    continue;
                  }
                }

                return { eventName: "Unknown", args: {} };
              })();

              if (eventName !== "Unknown") {
                allEvents.push({
                  id: `${log.transactionHash}-${log.logIndex}`,
                  contractName: source.name,
                  eventName,
                  args,
                  blockNumber: log.blockNumber ?? 0n,
                  transactionHash: log.transactionHash ?? ("0x" as `0x${string}`),
                });
              }
            } catch {
              // Skip undecoded logs
            }
          }
        } catch {
          // Contract not deployed or RPC issue
        }
      }

      // Sort by block number descending
      return allEvents.sort((a, b) =>
        Number(b.blockNumber) - Number(a.blockNumber)
      );
    },
    refetchInterval: 30000,
  });
}
