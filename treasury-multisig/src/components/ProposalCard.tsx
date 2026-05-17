// src/components/ProposalCard.tsx
"use client";

import Link from "next/link";
import { Proposal } from "@/types";
import { ThresholdIndicator } from "@/components/ThresholdIndicator";
import { CooldownTimer } from "@/components/CooldownTimer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  ChevronRight,
} from "lucide-react";

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

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  return (
    <Link href={`/proposals/${proposal.id}`}>
      <Card className="transition-colors hover:bg-accent/30 cursor-pointer">
        <CardContent className="p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold truncate">
                {proposal.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {proposal.description}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {proposal.severity && (
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${severityStyle[proposal.severity]}`}
                >
                  {proposal.severity}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${stateStyle[proposal.state]}`}
              >
                {proposal.state}
              </span>
            </div>
          </div>

          {/* Threshold indicator for active proposals */}
          {proposal.state === "Active" && (
            <div className="mt-4">
              <ThresholdIndicator
                forVotes={proposal.forVotes}
                requiredVotes={3}
                totalVoters={5}
                severity={proposal.severity}
                showLabel={false}
              />
            </div>
          )}

          {/* Cooldown timer for succeeded proposals */}
          {proposal.state === "Succeeded" &&
            proposal.readyForExecutionAt && (
              <div className="mt-4">
                <CooldownTimer
                  readyForExecutionAt={proposal.readyForExecutionAt}
                  severity={proposal.severity}
                />
              </div>
            )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                {proposal.forVotes}
              </span>
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3 text-red-400" />
                {proposal.againstVotes}
              </span>
              <span className="flex items-center gap-1">
                <MinusCircle className="h-3 w-3" />
                {proposal.abstainVotes}
              </span>
              <span>ID: {proposal.id}</span>
              {proposal.createdAt && (
                <span>
                  {new Date(proposal.createdAt * 1000).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {proposal.state === "Active" && (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/proposals/${proposal.id}/vote`}>Vote</Link>
                </Button>
              )}
              {proposal.state === "Succeeded" && (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link href={`/proposals/${proposal.id}/execute`}>
                    Execute
                  </Link>
                </Button>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
