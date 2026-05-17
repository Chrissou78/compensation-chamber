"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useProposal } from "@/hooks/useProposals";
import { useVoting } from "@/hooks/useVoting";
import { useCanVote } from "@/hooks/useMultisig";
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
  XCircle,
  MinusCircle,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const proposalId = params?.id as string;
  const { data: proposal, isLoading } = useProposal(proposalId);
  const { castVote, isPending, isSuccess, hash } = useVoting();
  const canVote = useCanVote();
  const [selectedVote, setSelectedVote] = useState<0 | 1 | 2 | null>(null);

  const voteOptions = [
    {
      value: 1 as const,
      label: "For",
      description: "Approve this proposal",
      icon: CheckCircle,
      activeClass: "border-emerald-500 bg-emerald-500/10 text-emerald-400",
    },
    {
      value: 0 as const,
      label: "Against",
      description: "Reject this proposal",
      icon: XCircle,
      activeClass: "border-red-500 bg-red-500/10 text-red-400",
    },
    {
      value: 2 as const,
      label: "Abstain",
      description: "Abstain from voting",
      icon: MinusCircle,
      activeClass: "border-muted-foreground bg-accent text-foreground",
    },
  ];

  const handleVote = async () => {
    if (selectedVote === null || !proposalId) return;
    await castVote(proposalId, selectedVote);
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
            Back to Proposals
          </Link>
        </Button>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Proposal not found</p>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/proposals/${proposalId}`}>
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Proposal
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Vote Submitted</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your vote has been recorded on-chain
            </p>
            {hash && (
              <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                TX: {hash}
              </p>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/proposals/${proposalId}`}>View Proposal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/proposals/${proposalId}`}>
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Proposal
        </Link>
      </Button>

      {/* Proposal Summary */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cast Your Vote</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {proposal.title}
        </p>
      </div>

      {/* Eligibility Check */}
      {!canVote && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-400">
              Not Eligible to Vote
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Only active validators in the multisig can vote on proposals.
              Connect with a validator wallet to participate.
            </p>
          </div>
        </div>
      )}

      {/* Current Votes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Votes</CardTitle>
          <CardDescription>
            {proposal.forVotes + proposal.againstVotes + proposal.abstainVotes}{" "}
            of 5 votes cast — threshold is 3
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">
                {proposal.forVotes}
              </p>
              <p className="text-[10px] text-muted-foreground">For</p>
            </div>
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 text-center">
              <p className="text-lg font-bold text-red-400">
                {proposal.againstVotes}
              </p>
              <p className="text-[10px] text-muted-foreground">Against</p>
            </div>
            <div className="rounded-lg bg-accent p-3 text-center">
              <p className="text-lg font-bold">{proposal.abstainVotes}</p>
              <p className="text-[10px] text-muted-foreground">Abstain</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vote Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Select Your Vote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {voteOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedVote === option.value;
            return (
              <button
                key={option.value}
                onClick={() => setSelectedVote(option.value)}
                disabled={!canVote}
                className={`w-full flex items-center gap-4 rounded-lg border p-4 transition-colors text-left ${
                  isSelected
                    ? option.activeClass
                    : "border-border hover:bg-accent/50"
                } ${!canVote ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Icon
                  className={`h-5 w-5 shrink-0 ${isSelected ? "" : "text-muted-foreground"}`}
                />
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p
                    className={`text-xs ${isSelected ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="space-y-3">
        <Button
          className="w-full"
          size="lg"
          disabled={selectedVote === null || isPending || !canVote}
          onClick={handleVote}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Vote...
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Confirm Vote
            </>
          )}
        </Button>
        <p className="text-[11px] text-center text-muted-foreground">
          This will send a transaction to the Governor contract. Gas fees apply.
        </p>
      </div>
    </div>
  );
}
