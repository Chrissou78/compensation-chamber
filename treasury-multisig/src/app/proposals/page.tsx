// src/app/proposals/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useProposals } from "@/hooks/useProposals";
import { ProposalCard } from "@/components/ProposalCard";
import { ProposalCardSkeleton } from "@/components/Skeleton";
import { PROPOSAL_STATES } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ScrollText } from "lucide-react";

export default function ProposalsPage() {
  const { data: proposals, isLoading } = useProposals();
  const [filter, setFilter] = useState<string>("All");

  const filteredProposals =
    filter === "All"
      ? proposals
      : proposals?.filter((p) => p.state === filter);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Proposals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage governance proposals
        </p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "All" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("All")}
        >
          All
        </Button>
        {PROPOSAL_STATES.map((state) => (
          <Button
            key={state}
            variant={filter === state ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(state)}
          >
            {state}
          </Button>
        ))}
      </div>

      {/* Proposals List */}
      {isLoading ? (
        <div className="space-y-4">
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
          <ProposalCardSkeleton />
        </div>
      ) : !filteredProposals || filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <ScrollText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No proposals found</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/actions">Create a Proposal</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  );
}
