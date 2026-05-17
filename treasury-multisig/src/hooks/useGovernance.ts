// src/hooks/useGovernance.ts
"use client";

import { useReadContract } from "wagmi";
import { getContractConfig } from "@/lib/contract";

export function useValidatorLimits() {
  const config = getContractConfig("validators");
  const enabled = config.address !== ("0x" as `0x${string}`);

  const { data: minValidators } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "minValidators",
    query: { enabled },
  });

  const { data: maxValidators } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "maxValidators",
    query: { enabled },
  });

  const { data: configVersion } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "configurationVersion",
    query: { enabled },
  });

  return {
    minValidators: minValidators ? Number(minValidators) : 3,
    maxValidators: maxValidators ? Number(maxValidators) : 20,
    configVersion: configVersion ? Number(configVersion) : 0,
  };
}

export function useActionThreshold(actionType: number) {
  const config = getContractConfig("validators");

  const { data, isLoading } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "getActionThreshold",
    args: [actionType],
    query: { enabled: config.address !== ("0x" as `0x${string}`) },
  });

  const threshold = data as
    | {
        id: string;
        actionType: number;
        requiredSignatures: bigint;
        setAt: bigint;
        description: string;
        active: boolean;
      }
    | undefined;

  return {
    requiredSignatures: threshold
      ? Number(threshold.requiredSignatures)
      : 3,
    description: threshold?.description ?? "",
    isActive: threshold?.active ?? true,
    isLoading,
  };
}

export function useGovernorConstants() {
  const config = getContractConfig("governor");
  const enabled = config.address !== ("0x" as `0x${string}`);

  const { data: passageThreshold } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "PASSAGE_THRESHOLD",
    query: { enabled },
  });

  const { data: quorumPercentage } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "QUORUM_PERCENTAGE",
    query: { enabled },
  });

  return {
    passageThreshold: passageThreshold ? Number(passageThreshold) : 60,
    quorumPercentage: quorumPercentage ? Number(quorumPercentage) : 4,
  };
}

export function useProposalState(proposalId: string) {
  const config = getContractConfig("governor");

  const { data: stateExtended, isLoading } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "getProposalState",
    args: [BigInt(proposalId || "0")],
    query: { enabled: config.address !== ("0x" as `0x${string}`) && !!proposalId },
  });

  const { data: isReady } = useReadContract({
    address: config.address,
    abi: config.abi,
    functionName: "isReadyForExecution",
    args: [BigInt(proposalId || "0")],
    query: { enabled: config.address !== ("0x" as `0x${string}`) && !!proposalId },
  });

  const extended = stateExtended as
    | {
        severity: number;
        thresholdReachedAt: bigint;
        readyForExecutionAt: bigint;
        thresholdMet: boolean;
        executed: boolean;
      }
    | undefined;

  return {
    severity: extended?.severity ?? 0,
    thresholdReachedAt: extended ? Number(extended.thresholdReachedAt) : 0,
    readyForExecutionAt: extended ? Number(extended.readyForExecutionAt) : 0,
    thresholdMet: extended?.thresholdMet ?? false,
    executed: extended?.executed ?? false,
    isReadyForExecution: (isReady as boolean) ?? false,
    isLoading,
  };
}
