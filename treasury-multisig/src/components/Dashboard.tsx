'use client';

import { useAccount } from 'wagmi';
import { useProposals } from '@/hooks/useProposals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const { proposals, isLoading } = useProposals();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold mb-4">Treasury Multisig Wallet</h1>
        <p className="text-gray-500 mb-6">Connect your wallet to get started</p>
      </div>
    );
  }

  const pendingProposals = proposals.filter((p) => !p.executed && !p.cancelled);
  const activeThreshold = proposals.filter(
    (p) => p.thresholdReachedAt && !p.executed && !p.cancelled
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Treasury Multisig</h1>
        <p className="text-gray-500">Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingProposals.length}</div>
            <p className="text-xs text-gray-500">Awaiting votes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Threshold Met</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeThreshold.length}</div>
            <p className="text-xs text-gray-500">Ready in cooldown</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">3-of-5 Requirement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">✓</div>
            <p className="text-xs text-gray-500">Signatures needed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Network</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Amoy</div>
            <p className="text-xs text-gray-500">Polygon Testnet</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Select an action to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            <Link href="/actions">
              <Button>Browse All Actions</Button>
            </Link>
            <Link href="/actions/vote_on_proposal">
              <Button variant="outline">Vote</Button>
            </Link>
            <Link href="/actions/propose_threshold_change">
              <Button variant="outline">Create Proposal</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Proposals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Proposals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : proposals.length === 0 ? (
            <div className="text-gray-500">No proposals yet</div>
          ) : (
            <div className="space-y-4">
              {proposals.slice(0, 5).map((proposal) => (
                <div key={proposal.id} className="border rounded p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{proposal.description.split('\n')[0]}</h4>
                      <p className="text-sm text-gray-500">
                        {proposal.forVotes} FOR · {proposal.againstVotes} AGAINST · {proposal.abstainVotes} ABSTAIN
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      proposal.executed ? 'bg-green-100 text-green-800' :
                      proposal.thresholdReachedAt ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {proposal.executed ? 'Executed' : proposal.thresholdReachedAt ? 'Cooldown' : 'Voting'}
                    </span>
                  </div>
                  <Link href={`/actions/vote_on_proposal?proposalId=${proposal.id}`}>
                    <Button size="sm" variant="outline" className="mt-2">
                      View Details
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
