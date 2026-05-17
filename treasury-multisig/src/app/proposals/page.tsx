"use client"

import { useState } from "react"
import Link from "next/link"
import { useProposals } from "@/hooks/useProposals"
import { ProposalCard } from "@/components/ProposalCard"
import { PROPOSAL_STATES } from "@/lib/constants"

export default function ProposalsPage() {
  const { data: proposals, isLoading } = useProposals()
  const [selectedState, setSelectedState] = useState<string | null>(null)

  const filteredProposals = selectedState
    ? proposals?.filter((p) => p.state === selectedState)
    : proposals

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Proposals</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            View and vote on governance proposals
          </p>
        </div>

        {/* State Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setSelectedState(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedState === null
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            All States
          </button>
          {PROPOSAL_STATES.map((state) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedState === state
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {state}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">Loading proposals...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && (!filteredProposals || filteredProposals.length === 0) && (
          <div className="text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No proposals found</p>
          </div>
        )}

        {/* Proposals List */}
        {!isLoading && filteredProposals && filteredProposals.length > 0 && (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
