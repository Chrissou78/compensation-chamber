"use client";

import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import { ProposalCard } from "@/components/ProposalCard";
import { PROPOSAL_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";

export default function ProposalsPage() {
  const { data: proposals, isLoading } = useProposals();
  const [selectedState, setSelectedState] = useState<string | null>(null);

  const filteredProposals = selectedState
    ? proposals?.filter((p) => p.state === selectedState)
    : proposals;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and vote on governance proposals
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedState === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedState(null)}
        >
          All
        </Button>
        {PROPOSAL_STATES.map((state) => (
          <Button
            key={state}
            variant={selectedState === state ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedState(state)}
          >
            {state}
          </Button>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading proposals...</p>
        </div>
      )}

      {!isLoading && (!filteredProposals || filteredProposals.length === 0) && (
        <div className="flex flex-col items-center justify-center py-16">
          <ScrollText className="h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No proposals found</p>
        </div>
      )}

      {!isLoading && filteredProposals && filteredProposals.length > 0 && (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
