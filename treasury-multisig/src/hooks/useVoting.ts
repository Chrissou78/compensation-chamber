// src/hooks/useVoting.ts
"use client";

import { useCallback } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { type Address, keccak256, toBytes, parseEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import {
  GOVERNOR_ABI,
  TREASURY_ABI,
  REGISTRY_ABI,
  GAS_REFILLER_ABI,
} from "@/lib/abi";
import { useAppStore } from "@/store";

// ─── Helpers ────────────────────────────────────────────────
const governorAddress = CONTRACT_ADDRESSES.UPGRADE_GOVERNOR as Address;
const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER as Address;
const registryAddress = CONTRACT_ADDRESSES.VALIDATOR_REGISTRY as Address;
const gasRefillerAddress = CONTRACT_ADDRESSES.GAS_REFILLER as Address;

function truncate(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// ─── 1. Voting ──────────────────────────────────────────────
export function useVoting() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const castVote = useCallback(
    (proposalId: string, voteType: 0 | 1 | 2) => {
      writeContract(
        {
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "castVote",
          args: [BigInt(proposalId), voteType],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Vote submitted",
              message: `Transaction sent for proposal #${proposalId}`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Vote failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  const castVoteWithReason = useCallback(
    (proposalId: string, voteType: 0 | 1 | 2, reason: string) => {
      writeContract(
        {
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "castVoteWithReason",
          args: [BigInt(proposalId), voteType, reason],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Vote submitted",
              message: `Vote with reason sent for proposal #${proposalId}`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Vote failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    castVote,
    castVoteWithReason,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 2. Propose ─────────────────────────────────────────────
export function usePropose() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const propose = useCallback(
    (
      targets: Address[],
      values: bigint[],
      calldatas: `0x${string}`[],
      description: string,
      severity: number
    ) => {
      writeContract(
        {
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "proposeWithSeverity",
          args: [targets, values, calldatas, description, severity],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Proposal created",
              message: "Transaction sent — awaiting confirmation",
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Proposal failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    propose,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 3. Execute Proposal ────────────────────────────────────
export function useExecuteProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const executeProposal = useCallback(
    (
      targets: Address[],
      values: bigint[],
      calldatas: `0x${string}`[],
      description: string,
      proposalId: string
    ) => {
      const descriptionHash = keccak256(toBytes(description));

      writeContract(
        {
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "executeProposal",
          args: [targets, values, calldatas, descriptionHash, BigInt(proposalId)],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Proposal executed",
              message: `Proposal #${proposalId} executed on-chain`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Execution failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    executeProposal,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 4. Cancel Proposal ─────────────────────────────────────
export function useCancelProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const cancelProposal = useCallback(
    (proposalId: string) => {
      writeContract(
        {
          address: governorAddress,
          abi: GOVERNOR_ABI,
          functionName: "cancelProposal",
          args: [BigInt(proposalId)],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Proposal cancelled",
              message: `Proposal #${proposalId} has been cancelled`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Cancel failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    cancelProposal,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 5. Pause / Unpause Treasury ────────────────────────────
export function usePauseTreasury() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const pause = useCallback(() => {
    writeContract(
      {
        address: treasuryAddress,
        abi: TREASURY_ABI,
        functionName: "pause",
      },
      {
        onSuccess: () =>
          addToast({
            type: "warning",
            title: "Treasury paused",
            message: "All treasury operations have been halted",
          }),
        onError: (err) =>
          addToast({
            type: "error",
            title: "Pause failed",
            message: err.message.slice(0, 100),
          }),
      }
    );
  }, [writeContract, addToast]);

  const unpause = useCallback(() => {
    writeContract(
      {
        address: treasuryAddress,
        abi: TREASURY_ABI,
        functionName: "unpause",
      },
      {
        onSuccess: () =>
          addToast({
            type: "success",
            title: "Treasury unpaused",
            message: "Treasury operations have been resumed",
          }),
        onError: (err) =>
          addToast({
            type: "error",
            title: "Unpause failed",
            message: err.message.slice(0, 100),
          }),
      }
    );
  }, [writeContract, addToast]);

  return {
    pause,
    unpause,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 6. Refill Gas ──────────────────────────────────────────
export function useRefillGas() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const refillGas = useCallback(
    (contractAddress: Address, maticAmount: string) => {
      writeContract(
        {
          address: gasRefillerAddress,
          abi: GAS_REFILLER_ABI,
          functionName: "refillContractGas",
          args: [contractAddress, parseEther(maticAmount)],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Gas refilled",
              message: `${maticAmount} MATIC sent to ${truncate(contractAddress)}`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Refill failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    refillGas,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 7. Authorize / Revoke Agent ────────────────────────────
export function useAuthorizeAgent() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const authorizeAgent = useCallback(
    (agentAddress: Address) => {
      writeContract(
        {
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: "authorizeAgent",
          args: [agentAddress],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Agent authorized",
              message: `${truncate(agentAddress)} can now execute orders`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Authorization failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  const revokeAgent = useCallback(
    (agentAddress: Address) => {
      writeContract(
        {
          address: treasuryAddress,
          abi: TREASURY_ABI,
          functionName: "revokeAgent",
          args: [agentAddress],
        },
        {
          onSuccess: () =>
            addToast({
              type: "warning",
              title: "Agent revoked",
              message: `${truncate(agentAddress)} authorization removed`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Revocation failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    authorizeAgent,
    revokeAgent,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}

// ─── 8. Validator Actions ───────────────────────────────────
export function useValidatorActions() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });
  const addToast = useAppStore((s) => s.addToast);

  const addValidator = useCallback(
    (wallet: Address, name: string, role: string) => {
      writeContract(
        {
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "addValidator",
          args: [wallet, name, role],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Validator added",
              message: `${name} (${truncate(wallet)}) added to registry`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Add validator failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  const removeValidator = useCallback(
    (validatorId: `0x${string}`) => {
      writeContract(
        {
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "removeValidator",
          args: [validatorId],
        },
        {
          onSuccess: () =>
            addToast({
              type: "warning",
              title: "Validator removed",
              message: "Validator has been removed from the registry",
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Remove validator failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  const updateValidatorStatus = useCallback(
    (validatorId: `0x${string}`, newStatus: number) => {
      writeContract(
        {
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "updateValidatorStatus",
          args: [validatorId, newStatus],
        },
        {
          onSuccess: () =>
            addToast({
              type: "info",
              title: "Status updated",
              message: `Validator status changed to ${newStatus === 0 ? "ACTIVE" : "BLACKLISTED"}`,
            }),
          onError: (err) =>
            addToast({
              type: "error",
              title: "Status update failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  const setActionThreshold = useCallback(
    (actionType: number, requiredSignatures: number, description: string) => {
      // setActionThreshold(uint8, uint256, string) — uint256 must be bigint
      (writeContract as (args: Record<string, unknown>, opts?: Record<string, unknown>) => void)(
        {
          address: registryAddress,
          abi: REGISTRY_ABI,
          functionName: "setActionThreshold",
          args: [actionType, BigInt(requiredSignatures), description],
        },
        {
          onSuccess: () =>
            addToast({
              type: "success",
              title: "Threshold updated",
              message: `New threshold: ${requiredSignatures} signatures required`,
            }),
          onError: (err: Error) =>
            addToast({
              type: "error",
              title: "Threshold update failed",
              message: err.message.slice(0, 100),
            }),
        }
      );
    },
    [writeContract, addToast]
  );

  return {
    addValidator,
    removeValidator,
    updateValidatorStatus,
    setActionThreshold,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
    error,
  };
}
