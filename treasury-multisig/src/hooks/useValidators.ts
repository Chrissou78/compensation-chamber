"use client"

import { useQuery } from "@tanstack/react-query"
import { useAccount, useReadContract } from "wagmi"
import { Validator } from "@/types"
import { getContractConfig } from "@/lib/contract"

// Mock data
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
]

export function useValidators() {
  const { isConnected } = useAccount()
  const config = getContractConfig("validators")

  // TODO: Replace with actual contract read
  // const { data: validatorData } = useReadContract({
  //   address: config.address,
  //   abi: config.abi,
  //   functionName: 'getAllValidators',
  //   enabled: isConnected,
  // })

  return useQuery({
    queryKey: ["validators"],
    queryFn: async (): Promise<Validator[]> => {
      if (!isConnected) return []

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 300))
      return MOCK_VALIDATORS
    },
    enabled: isConnected,
    refetchInterval: 60000, // Refetch every minute
  })
}

export function useValidatorCount() {
  const { data: validators } = useValidators()
  return {
    total: validators?.length || 0,
    active: validators?.filter((v) => v.status === "ACTIVE").length || 0,
    blacklisted: validators?.filter((v) => v.status === "BLACKLISTED").length || 0,
  }
}

export function useValidatorThreshold(actionType: string) {
  const config = getContractConfig("validators")

  // TODO: Implement actual contract read
  // const { data: threshold } = useReadContract({
  //   address: config.address,
  //   abi: config.abi,
  //   functionName: 'getThreshold',
  //   args: [actionType],
  // })

  return { threshold: 3 } // Mock: 3-of-5
}
