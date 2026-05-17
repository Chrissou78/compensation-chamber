// src/hooks/useProposals.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { Proposal } from "@/types";
import { SUBGRAPH_QUERY } from "@/lib/constants";

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

// Fallback mock data
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
];

async function fetchFromSubgraph(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<Proposal[]> {
  if (!SUBGRAPH_URL) throw new Error("No subgraph URL configured");

  const response = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) throw new Error(`Subgraph error: ${response.status}`);

  const json = await response.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "Subgraph query error");

  return (json.data?.proposals ?? []).map(
    (p: Record<string, unknown>) => ({
      id: String(p.id),
      title: (p.title as string) || `Proposal #${p.id}`,
      description: (p.description as string) || "",
      targets: (p.targets as string[]) || [],
      values: (p.values as string[]) || [],
      calldatas: (p.calldatas as string[]) || [],
      startBlock: Number(p.startBlock ?? 0),
      endBlock: Number(p.endBlock ?? 0),
      forVotes: Number(p.forVotes ?? 0),
      againstVotes: Number(p.againstVotes ?? 0),
      abstainVotes: Number(p.abstainVotes ?? 0),
      canceled: Boolean(p.canceled),
      executed: Boolean(p.executed),
      state: (p.state as string) || "Pending",
      severity: (p.severity as string) || "ROUTINE",
      thresholdReachedAt: p.thresholdReachedAt
        ? Number(p.thresholdReachedAt)
        : undefined,
      readyForExecutionAt: p.readyForExecutionAt
        ? Number(p.readyForExecutionAt)
        : undefined,
      createdAt: p.createdAt ? Number(p.createdAt) : undefined,
    })
  );
}

export function useProposals() {
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<Proposal[]> => {
      if (!isConnected) return [];

      // Try Subgraph first
      if (SUBGRAPH_URL) {
        try {
          return await fetchFromSubgraph(SUBGRAPH_QUERY.GET_PROPOSALS, {
            first: 50,
            skip: 0,
          });
        } catch (err) {
          console.warn("Subgraph fetch failed, using mock data:", err);
        }
      }

      // Fallback to mock data
      await new Promise((resolve) => setTimeout(resolve, 500));
      return MOCK_PROPOSALS;
    },
    enabled: isConnected,
    refetchInterval: 30000,
  });
}

export function useProposal(proposalId: string) {
  const { isConnected } = useAccount();

  return useQuery({
    queryKey: ["proposal", proposalId],
    queryFn: async (): Promise<Proposal | null> => {
      if (!isConnected) return null;

      // Try Subgraph
      if (SUBGRAPH_URL) {
        try {
          const proposals = await fetchFromSubgraph(
            `query GetProposal($id: ID!) {
              proposals(where: { id: $id }) {
                id title description state severity
                forVotes againstVotes abstainVotes
                targets values calldatas
                startBlock endBlock
                canceled executed
                createdAt thresholdReachedAt readyForExecutionAt
              }
            }`,
            { id: proposalId }
          );
          return proposals[0] ?? null;
        } catch {
          // fallthrough
        }
      }

      return MOCK_PROPOSALS.find((p) => p.id === proposalId) || null;
    },
    enabled: isConnected && !!proposalId,
  });
}

export function useActiveProposals() {
  const { data: proposals, isLoading } = useProposals();

  const activeProposals =
    proposals?.filter((p) => p.state === "Active") || [];
  const pendingProposals =
    proposals?.filter((p) =>
      ["Pending", "Active"].includes(p.state)
    ) || [];

  return { activeProposals, pendingProposals, isLoading };
}
