// src/app/proposals/[id]/execute/page.tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useProposal } from "@/hooks/useProposals";
import { useExecuteProposal } from "@/hooks/useVoting";
import { CooldownTimer } from "@/components/CooldownTimer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Zap,
  AlertTriangle,
} from "lucide-react";

export default function ExecuteProposalPage() {
  const params = useParams();
  const proposalId = params?.id as string;
  const { data: proposal, isLoading } = useProposal(proposalId);
  const {
    executeProposal,
    isPending: executing,
    isSuccess: executed,
    hash,
    error: txError,
  } = useExecuteProposal();
  const [cooldownExpired, setCooldownExpired] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!proposal) return;
    setLocalError(null);

    try {
      await executeProposal(
        proposal.targets as `0x${string}`[],
        proposal.values.map((v) => BigInt(v)),
        proposal.calldatas as `0x${string}`[],
        proposal.description,
        proposalId
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Execution failed";
      setLocalError(message);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/proposals/${proposalId}`}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Proposal
          </Link>
        </Button>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proposals">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Proposal not found</p>
        </div>
      </div>
    );
  }

  if (executed) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proposals">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Proposals
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Proposal Executed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              All target contracts have been called successfully
            </p>
            {hash && (
              <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                TX: {hash}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/proposals">View All Proposals</Link>
          </Button>
        </div>
      </div>
    );
  }

  const canExecute =
    proposal.state === "Succeeded" &&
    (!proposal.readyForExecutionAt || cooldownExpired);

  const displayError = localError || txError?.message;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/proposals/${proposalId}`}>
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Proposal
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Execute Proposal</h1>
        <p className="text-sm text-muted-foreground mt-1">{proposal.title}</p>
      </div>

      {/* Cooldown */}
      {proposal.readyForExecutionAt && (
        <CooldownTimer
          readyForExecutionAt={proposal.readyForExecutionAt}
          severity={proposal.severity}
          onExpired={() => setCooldownExpired(true)}
        />
      )}

      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Execution Summary</CardTitle>
          <CardDescription>
            The following operations will be executed atomically
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Targets</span>
            <span className="font-medium">
              {proposal.targets.filter((t) => t !== "0x").length || 1}{" "}
              contract(s)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vote Result</span>
            <span className="font-medium text-emerald-400">
              {proposal.forVotes} For / {proposal.againstVotes} Against
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Severity</span>
            <span className="font-medium">
              {proposal.severity || "ROUTINE"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
        <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-amber-400">
            Irreversible Action
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Executing this proposal will call the target contracts with the
            specified calldata. This action cannot be undone. Make sure all
            parameters have been reviewed.
          </p>
        </div>
      </div>

      {displayError && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{displayError}</p>
        </div>
      )}

      <Button
        className="w-full"
        size="lg"
        disabled={!canExecute || executing}
        onClick={handleExecute}
      >
        {executing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Executing...
          </>
        ) : !canExecute ? (
          "Awaiting Cooldown..."
        ) : (
          <>
            <Zap className="mr-2 h-4 w-4" />
            Execute Proposal
          </>
        )}
      </Button>
    </div>
  );
}
