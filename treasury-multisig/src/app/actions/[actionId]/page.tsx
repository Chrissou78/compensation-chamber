"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { ACTIONS_CONFIG } from "@/lib/constants"
import { ActionType } from "@/types"
import { ActionForm } from "@/components/ActionForm"

export default function ActionPage() {
  const params = useParams()
  const actionId = params?.actionId as string

  if (!actionId) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Action not found</p>
      </div>
    )
  }

  const config = ACTIONS_CONFIG[actionId as ActionType]

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600 dark:text-slate-400">Action not found</p>
        <Link href="/actions" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
          ← Back to Actions
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/actions"
          className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 mb-8 font-medium"
        >
          ← Back to Actions
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{config.icon}</span>
            <div>
              <h1 className="text-3xl font-bold">{config.title}</h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">{config.description}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {config.category.toUpperCase()}
            </span>
            {config.requiresApproval && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                Requires Approval
              </span>
            )}
            {config.requiresVoting && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                Governance Vote
              </span>
            )}
          </div>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 card-shadow">
            <ActionForm config={config} />
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            {/* Action Details */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
              <h3 className="font-semibold mb-4">Action Details</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Category</p>
                  <p className="font-medium text-slate-900 dark:text-white capitalize">
                    {config.category}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Requires Approval</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {config.requiresApproval ? "✓ Yes" : "✗ No"}
                  </p>
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-400">Requires Voting</p>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {config.requiresVoting ? "✓ Yes (3-of-5)" : "✗ No"}
                  </p>
                </div>
              </div>
            </div>

            {/* Fields Info */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
              <h3 className="font-semibold mb-4">Required Fields</h3>
              <div className="space-y-2">
                {config.fields.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-400">No fields required</p>
                ) : (
                  config.fields.map((field) => (
                    <div key={field.name} className="flex items-center gap-2 text-sm">
                      <span className="text-slate-400">•</span>
                      <span>{field.label}</span>
                      {field.required && (
                        <span className="text-red-500 font-bold">*</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Help */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                💡 Need Help?
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Fill out the form with the required information and review your submission before
                confirming. This action {config.requiresApproval ? "will require multisig approval" : ""}{" "}
                {config.requiresVoting ? "and a governance vote (3-of-5 threshold)" : ""}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
