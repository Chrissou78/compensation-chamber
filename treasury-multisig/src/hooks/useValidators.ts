// src/hooks/useValidators.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount, usePublicClient } from "wagmi";
import { Validator } from "@/types";
import { getContractConfig } from "@/lib/contract";

// Fallback mock data — used when contracts aren't deployed yet
const MOCK_VALIDATORS: Validator[] = [
  {
    address: "0x1234567890123456789012345678901234567890",
    name: "CEO",
    status: "ACTIVE",
    votingPower: 200000,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 30,
  },
  {
    address: "0x0987654321098765432109876543210987654321",
    name: "CFO",
    status: "ACTIVE",
    votingPower: 200000,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 20,
  },
  {
    address: "0x1111111111111111111111111111111111111111",
    name: "Compliance Officer",
    status: "ACTIVE",
    votingPower: 200000,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 15,
  },
  {
    address: "0x2222222222222222222222222222222222222222",
    name: "Technical Lead",
    status: "ACTIVE",
    votingPower: 200000,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 10,
  },
  {
    address: "0x3333333333333333333333333333333333333333",
    name: "External Auditor",
    status: "ACTIVE",
    votingPower: 200000,
    joinedAt: Math.floor(Date.now() / 1000) - 86400 * 5,
  },
];

const STATUS_MAP: Record<number, "ACTIVE" | "BLACKLISTED"> = {
  0: "ACTIVE",
  1: "BLACKLISTED",
};

export function useValidators() {
  const { isConnected } = useAccount();
  const publicClient = usePublicClient();
  const config = getContractConfig("validators");

  return useQuery({
    queryKey: ["validators"],
    queryFn: async (): Promise<Validator[]> => {
      if (!isConnected) return [];

      // Try reading from the contract first
      if (publicClient && config.address !== "0x") {
        try {
          const rawValidators = (await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: "getAllValidators",
          })) as Array<{
            id: string;
            wallet: string;
            name: string;
            role: string;
            status: number;
            addedAt: bigint;
            removedAt: bigint;
          }>;

          return rawValidators.map((v) => ({
            address: v.wallet,
            name: v.name || v.role || "Validator",
            status: STATUS_MAP[v.status] ?? "ACTIVE",
            votingPower: 200000, // Each validator gets equal 200K TGV
            joinedAt: Number(v.addedAt),
          }));
        } catch {
          // Contract not deployed or call failed — fall through to mock
        }
      }

      // Fallback to mock data
      await new Promise((resolve) => setTimeout(resolve, 300));
      return MOCK_VALIDATORS;
    },
    enabled: isConnected,
    refetchInterval: 60000,
  });
}

export function useValidatorCount() {
  const { data: validators } = useValidators();
  return {
    total: validators?.length || 0,
    active:
      validators?.filter((v) => v.status === "ACTIVE").length || 0,
    blacklisted:
      validators?.filter((v) => v.status === "BLACKLISTED").length || 0,
  };
}

export function useValidatorThreshold(actionType: number) {
  const config = getContractConfig("validators");
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ["validatorThreshold", actionType],
    queryFn: async (): Promise<number> => {
      if (publicClient && config.address !== "0x") {
        try {
          const result = (await publicClient.readContract({
            address: config.address,
            abi: config.abi,
            functionName: "getActionThreshold",
            args: [actionType],
          })) as { requiredSignatures: bigint };
          return Number(result.requiredSignatures);
        } catch {
          // Fallback
        }
      }
      return 3; // Default 3-of-5
    },
    refetchInterval: 120000,
  });
}
