"use client"

import { useCallback } from "react"
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { getContractConfig } from "@/lib/contract"

export function useVoting() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const castVote = useCallback(
    async (proposalId: string, voteType: 0 | 1 | 2) => {
      const config = getContractConfig("governor")

      writeContract({
        address: config.address,
        abi: config.abi,
        functionName: "castVote",
        args: [BigInt(proposalId), voteType],
      })
    },
    [writeContract]
  )

  return {
    castVote,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

export function usePropose() {
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const propose = useCallback(
    async (
      targets: string[],
      values: bigint[],
      calldatas: string[],
      description: string,
      severity: number
    ) => {
      const config = getContractConfig("governor")

      writeContract({
        address: config.address,
        abi: config.abi,
        functionName: "proposeWithSeverity",
        args: [targets, values, calldatas, description, severity],
      })
    },
    [writeContract]
  )

  return {
    propose,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}
