"use client"

import { useQuery } from "@tanstack/react-query"
import { useAccount } from "wagmi"
import { Proposal } from "@/types"

// Mock data - replace with actual Subgraph query
const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "1",
    title: "Add New Validator",
    description: "Proposal to add CFO as validator",
    targets: ["0x"],
    values: [],
    calldatas: [],
    startBlock: 1000,
    endBlock: 2000,
    forVotes: 2,
    againstVotes: 0,
    abstainVotes: 1,
    canceled: false,
    executed: false,
    state: "Active",
    severity: "CRITICAL",
    thresholdReachedAt: undefined,
    readyForExecutionAt: undefined,
    createdAt: Math.floor(Date.now() / 1000) - 3600,
  },
  {
    id: "2",
    title: "Transfer Ownership",
    description: "Transfer contracts to new multisig",
    targets: ["0x"],
    values: [],
    calldatas: [],
    startBlock: 900,
    endBlock: 1800,
    forVotes: 3,
    againstVotes: 0,
    abstainVotes: 2,
    canceled: false,
    executed: false,
    state: "Succeeded",
    severity: "CRITICAL",
    thresholdReachedAt: Math.floor(Date.now() / 1000) - 1800,
    readyForExecutionAt: Math.floor(Date.now() / 1000) + 82400,
    createdAt: Math.floor(Date.now() / 1000) - 7200,
  },
]

export function useProposals() {
  const { isConnected } = useAccount()

  return useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<Proposal[]> => {
      if (!isConnected) return []

      // TODO: Replace with actual Subgraph query
      // const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL, {
      //   method: 'POST',
      //   body: JSON.stringify({ query: SUBGRAPH_QUERY.GET_PROPOSALS }),
      // })
      // const data = await response.json()
      // return data.data.proposals

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 500))
      return MOCK_PROPOSALS
    },
    enabled: isConnected,
    refetchInterval: 30000, // Refetch every 30s
  })
}

export function useProposal(proposalId: string) {
  const { isConnected } = useAccount()

  return useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async (): Promise<Proposal | null> => {
      if (!isConnected) return null

      // TODO: Fetch single proposal
      return MOCK_PROPOSALS.find((p) => p.id === proposalId) || null
    },
    enabled: isConnected && !!proposalId,
  })
}

export function useActiveProposals() {
  const { data: proposals, isLoading } = useProposals()

  const activeProposals = proposals?.filter((p) => p.state === "Active") || []
  const pendingProposals =
    proposals?.filter((p) => ["Pending", "Active"].includes(p.state)) || []

  return { activeProposals, pendingProposals, isLoading }
}
