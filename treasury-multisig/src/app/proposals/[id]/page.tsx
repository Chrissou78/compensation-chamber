"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useProposal } from "@/hooks/useProposals";
import { ThresholdIndicator } from "@/components/ThresholdIndicator";
import { CooldownTimer } from "@/components/CooldownTimer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  MinusCircle,
  Clock,
  Hash,
  Calendar,
  Shield,
  FileText,
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

export default function ProposalDetailPage() {
  const params = useParams();
  const proposalId = params?.id as string;
  const { data: proposal, isLoading } = useProposal(proposalId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/proposals">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Proposals
          </Link>
        </Button>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading proposal...</p>
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
            Back to Proposals
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <FileText className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Proposal not found</p>
        </div>
      </div>
    );
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

  return (
    <div className="space-y-8">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/proposals">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Proposals
        </Link>
      </Button>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {proposal.title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {proposal.description}
            </p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${severityStyle[proposal.severity || "ROUTINE"]}`}
            >
              {proposal.severity || "ROUTINE"}
            </span>
            <span
              className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${stateStyle[proposal.state]}`}
            >
              {proposal.state}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Threshold */}
          {proposal.state === "Active" && (
            <ThresholdIndicator
              forVotes={proposal.forVotes}
              requiredVotes={3}
              totalVoters={5}
              severity={proposal.severity}
            />
          )}

          {/* Cooldown */}
          {proposal.state === "Succeeded" && proposal.readyForExecutionAt && (
            <CooldownTimer
              readyForExecutionAt={proposal.readyForExecutionAt}
              severity={proposal.severity}
            />
          )}

          {/* Votes */}
          <Card>
            <CardHeader>
              <CardTitle>Vote Results</CardTitle>
              <CardDescription>
                {totalVotes} of 5 validators voted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-4 text-center">
                  <CheckCircle className="h-5 w-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-400">
                    {proposal.forVotes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">For</p>
                </div>
                <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-4 text-center">
                  <XCircle className="h-5 w-5 text-red-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-400">
                    {proposal.againstVotes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Against</p>
                </div>
                <div className="rounded-lg bg-accent p-4 text-center">
                  <MinusCircle className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
                  <p className="text-2xl font-bold">
                    {proposal.abstainVotes}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Abstain</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Targets */}
          {proposal.targets.length > 0 && proposal.targets[0] !== "0x" && (
            <Card>
              <CardHeader>
                <CardTitle>Execution Targets</CardTitle>
                <CardDescription>
                  Contracts and calldata to execute
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.targets.map((target, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-accent/50 p-3 space-y-1"
                  >
                    <p className="text-[11px] text-muted-foreground uppercase font-medium">
                      Target {i + 1}
                    </p>
                    <p className="font-mono text-xs break-all">{target}</p>
                    {proposal.calldatas[i] && (
                      <div className="mt-2">
                        <p className="text-[11px] text-muted-foreground uppercase font-medium">
                          Calldata
                        </p>
                        <p className="font-mono text-xs break-all text-muted-foreground">
                          {proposal.calldatas[i]}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {proposal.state === "Active" && (
                <Button className="w-full" asChild>
                  <Link href={`/proposals/${proposal.id}/vote`}>
                    Cast Vote
                  </Link>
                </Button>
              )}
              {proposal.state === "Succeeded" && (
                <Button className="w-full" asChild>
                  <Link href={`/proposals/${proposal.id}/execute`}>
                    Execute Proposal
                  </Link>
                </Button>
              )}
              {(proposal.state === "Active" || proposal.state === "Pending") && (
                <Button variant="destructive" className="w-full" size="sm">
                  Cancel Proposal
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3 w-3" /> ID
                </span>
                <span className="font-mono text-xs">{proposal.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3" /> Severity
                </span>
                <span className="font-medium">{proposal.severity || "ROUTINE"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> State
                </span>
                <span className="font-medium">{proposal.state}</span>
              </div>
              {proposal.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" /> Created
                  </span>
                  <span className="text-xs">
                    {new Date(proposal.createdAt * 1000).toLocaleString()}
                  </span>
                </div>
              )}
              {proposal.thresholdReachedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3" /> Threshold
                  </span>
                  <span className="text-xs">
                    {new Date(proposal.thresholdReachedAt * 1000).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Start Block</span>
                <span className="font-mono text-xs">{proposal.startBlock}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">End Block</span>
                <span className="font-mono text-xs">{proposal.endBlock}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
