"use client"

import { useState } from "react"
import Link from "next/link"
import { ActionType, ActionConfig } from "@/types"
import { ACTIONS_CONFIG, CATEGORY_LABELS, CATEGORY_COLORS } from "@/lib/constants"

export function ActionList() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categories = Array.from(
    new Set(Object.values(ACTIONS_CONFIG).map((a) => a.category))
  )

  const filteredActions = selectedCategory
    ? Object.values(ACTIONS_CONFIG).filter((a) => a.category === selectedCategory)
    : Object.values(ACTIONS_CONFIG)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Actions</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Select an action to execute or propose
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? "bg-blue-600 text-white"
              : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
          }`}
        >
          All Actions
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === cat
                ? "bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            {CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActions.map((action) => (
          <Link
            key={action.id}
            href={`/actions/${action.id}`}
            className="group"
          >
            <div className="h-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow hover:border-blue-400 dark:hover:border-blue-500 transition-all">
              {/* Icon & Title */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{action.icon}</span>
                    <h3 className="font-semibold text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {action.title}
                    </h3>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {action.description}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    CATEGORY_COLORS[action.category] ||
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {CATEGORY_LABELS[action.category]}
                </span>

                {action.requiresApproval && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                    Approval
                  </span>
                )}

                {action.requiresVoting && (
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Voting
                  </span>
                )}
              </div>

              {/* Click Indicator */}
              <div className="mt-4 text-right">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform inline-block">
                  Execute →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {filteredActions.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-600 dark:text-slate-400">
            No actions found in this category
          </p>
        </div>
      )}
    </div>
  )
}
