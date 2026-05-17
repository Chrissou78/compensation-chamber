"use client"

import Link from "next/link"
import { Proposal } from "@/types"
import { formatNumber } from "@/lib/utils"
import { ThresholdIndicator } from "./ThresholdIndicator"
import { CooldownTimer } from "./CooldownTimer"

interface ProposalCardProps {
  proposal: Proposal
  showActions?: boolean
}

export function ProposalCard({ proposal, showActions = true }: ProposalCardProps) {
  const severityColor = {
    EMERGENCY: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    CRITICAL: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20",
    IMPORTANT: "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",
    ROUTINE: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
  }[proposal.severity || "ROUTINE"]

  const stateColor = {
    Pending: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Active: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Canceled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Defeated: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    Succeeded: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    Expired: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    Executed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden card-shadow hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{proposal.title}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {proposal.description}
            </p>
          </div>
          <div className="flex gap-2 ml-4">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                severityColor.split(" ").slice(0, -2).join(" ")
              }`}
            >
              {proposal.severity || "ROUTINE"}
            </span>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${stateColor[proposal.state]}`}>
              {proposal.state}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Threshold Indicator */}
        {proposal.state === "Active" && (
          <ThresholdIndicator
            forVotes={proposal.forVotes}
            requiredVotes={3}
            totalVoters={5}
            severity={proposal.severity}
            showLabel={false}
          />
        )}

        {/* Cooldown Timer */}
        {proposal.state === "Succeeded" && proposal.readyForExecutionAt && (
          <CooldownTimer
            readyForExecutionAt={proposal.readyForExecutionAt}
            severity={proposal.severity}
          />
        )}

        {/* Vote Summary */}
        {proposal.state === "Active" && (
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-3">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">FOR</p>
              <p className="text-lg font-bold text-green-700 dark:text-green-300">
                {proposal.forVotes}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-3">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">AGAINST</p>
              <p className="text-lg font-bold text-red-700 dark:text-red-300">
                {proposal.againstVotes}
              </p>
            </div>
            <div className="rounded-lg bg-slate-100 dark:bg-slate-700 p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">ABSTAIN</p>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {proposal.abstainVotes}
              </p>
            </div>
          </div>
        )}

        {/* Details */}
        {proposal.id && (
          <div className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
            <p>
              <span className="font-medium">ID:</span> {proposal.id}
            </p>
            {proposal.createdAt && (
              <p>
                <span className="font-medium">Created:</span>{" "}
                {new Date(proposal.createdAt * 1000).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {showActions && (
        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex gap-3">
          {proposal.state === "Active" && (
            <Link
              href={`/proposals/${proposal.id}/vote`}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 font-medium text-sm transition-colors text-center"
            >
              Vote
            </Link>
          )}

          {proposal.state === "Succeeded" && (
            <Link
              href={`/proposals/${proposal.id}/execute`}
              className="flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-medium text-sm transition-colors text-center"
            >
              Execute
            </Link>
          )}

          <Link
            href={`/proposals/${proposal.id}`}
            className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 font-medium text-sm transition-colors text-center"
          >
            Details
          </Link>
        </div>
      )}
    </div>
  )
}
