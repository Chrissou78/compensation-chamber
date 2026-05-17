"use client";

import Link from "next/link";
import { Proposal } from "@/types";
import { ThresholdIndicator } from "./ThresholdIndicator";
import { CooldownTimer } from "./CooldownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const severityStyle: Record<string, string> = {
  EMERGENCY: "bg-red-500/10 text-red-400 ring-red-500/20",
  CRITICAL: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  IMPORTANT: "bg-yellow-500/10 text-yellow-400 ring-yellow-500/20",
  ROUTINE: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
};

const stateStyle: Record<string, string> = {
  Pending: "bg-muted text-muted-foreground ring-border",
  Active: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
  Canceled: "bg-red-500/10 text-red-400 ring-red-500/20",
  Defeated: "bg-red-500/10 text-red-400 ring-red-500/20",
  Succeeded: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
  Queued: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  Expired: "bg-muted text-muted-foreground ring-border",
  Executed: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
};

interface ProposalCardProps {
  proposal: Proposal;
  showActions?: boolean;
}

export function ProposalCard({ proposal, showActions = true }: ProposalCardProps) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{proposal.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{proposal.description}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${severityStyle[proposal.severity || "ROUTINE"]}`}>
              {proposal.severity || "ROUTINE"}
            </span>
            <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${stateStyle[proposal.state]}`}>
              {proposal.state}
            </span>
          </div>
        </div>

        {/* Threshold */}
        {proposal.state === "Active" && (
          <ThresholdIndicator forVotes={proposal.forVotes} requiredVotes={3} totalVoters={5} severity={proposal.severity} showLabel={false} />
        )}

        {/* Cooldown */}
        {proposal.state === "Succeeded" && proposal.readyForExecutionAt && (
          <CooldownTimer readyForExecutionAt={proposal.readyForExecutionAt} severity={proposal.severity} />
        )}

        {/* Votes */}
        {proposal.state === "Active" && (
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3">
              <p className="text-[10px] font-medium text-emerald-400 uppercase">For</p>
              <p className="text-lg font-bold text-emerald-400">{proposal.forVotes}</p>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
              <p className="text-[10px] font-medium text-red-400 uppercase">Against</p>
              <p className="text-lg font-bold text-red-400">{proposal.againstVotes}</p>
            </div>
            <div className="rounded-lg bg-accent p-3">
              <p className="text-[10px] font-medium text-muted-foreground uppercase">Abstain</p>
              <p className="text-lg font-bold">{proposal.abstainVotes}</p>
            </div>
          </div>
        )}

        {/* Meta */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>ID: {proposal.id}</p>
          {proposal.createdAt && (<p>Created: {new Date(proposal.createdAt * 1000).toLocaleDateString()}</p>)}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 pt-2 border-t border-border">
            {proposal.state === "Active" && (<Button size="sm" asChild><Link href={`/proposals/${proposal.id}/vote`}>Vote</Link></Button>)}
            {proposal.state === "Succeeded" && (<Button size="sm" variant="default" asChild><Link href={`/proposals/${proposal.id}/execute`}>Execute</Link></Button>)}
            <Button size="sm" variant="outline" asChild><Link href={`/proposals/${proposal.id}`}>Details</Link></Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
