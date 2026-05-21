// src/hooks/useThresholds.ts
"use client";

import { useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { REGISTRY_ABI } from "@/lib/abi";

/**
 * Maps the dropdown values from ACTIONS_CONFIG to the on-chain
 * DynamicValidatorRegistry.ActionType enum indices:
 *
 *   enum ActionType {
 *     PAYOUT,           // 0
 *     REBALANCE,        // 1
 *     STAKING,          // 2
 *     UPGRADE,          // 3
 *     PARAMETER_CHANGE, // 4
 *     VALIDATOR_ADD,    // 5
 *     VALIDATOR_REMOVE, // 6
 *     BLACKLIST,        // 7
 *     MINTING,          // 8
 *     GOVERNANCE        // 9
 *   }
 */
export const ACTION_TYPE_MAP: Record<string, number> = {
  PAYOUT: 0,
  REBALANCE: 1,
  STAKING: 2,
  UPGRADE: 3,
  MINTING: 8,
};

export function useRequiredSignatures(actionTypeKey: string | undefined) {
  const actionTypeNum =
    actionTypeKey !== undefined ? ACTION_TYPE_MAP[actionTypeKey] : undefined;

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.VALIDATOR_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "getRequiredSignatures",
    args: actionTypeNum !== undefined ? [actionTypeNum] : undefined,
    query: {
      enabled: actionTypeNum !== undefined,
    },
  });

  return {
    requiredSignatures: data as number | undefined,
    isLoading,
    error,
  };
}

export function useActiveValidatorCount() {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESSES.VALIDATOR_REGISTRY,
    abi: REGISTRY_ABI,
    functionName: "getActiveValidatorCount",
  });

  return {
    activeCount: data !== undefined ? Number(data) : undefined,
    isLoading,
    error,
  };
}
