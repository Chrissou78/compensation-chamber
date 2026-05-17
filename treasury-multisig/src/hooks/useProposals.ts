import { useQuery } from '@tanstack/react-query';
import { useAccount, useReadContract } from 'wagmi';
import { Proposal } from '@/types';

export function useProposals() {
  const { address } = useAccount();

  const { data: proposals, isLoading } = useQuery({
    queryKey: ['proposals', address],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUBGRAPH_URL}/graphql`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: `
              query GetProposals($first: Int!) {
                proposals(first: $first, orderBy: createdAt, orderDirection: desc) {
                  id
                  createdAt
                  proposer
                  targets
                  values
                  calldatas
                  description
                  severity
                  forVotes
                  againstVotes
                  abstainVotes
                  thresholdReachedAt
                  readyForExecutionAt
                  executed
                }
              }
            `,
            variables: { first: 100 },
          }),
        }
      );
      const json = await response.json();
      return json.data.proposals as Proposal[];
    },
    enabled: !!address,
  });

  return { proposals: proposals || [], isLoading };
}
