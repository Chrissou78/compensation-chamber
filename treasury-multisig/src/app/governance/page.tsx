"use client"

import { useState } from "react"
import Link from "next/link"
import { useValidators, useValidatorCount } from "@/hooks/useValidators"
import { formatAddress, formatNumber } from "@/lib/utils"
import { REQUIRED_THRESHOLD, TOTAL_VALIDATORS } from "@/lib/constants"

export default function GovernancePage() {
  const { data: validators, isLoading } = useValidators()
  const { total, active, blacklisted } = useValidatorCount()
  const [expandedValidator, setExpandedValidator] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Governance</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage validators, thresholds, and governance settings
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Validators</p>
            <p className="text-3xl font-bold mt-2">{total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {active} active, {blacklisted} blacklisted
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Signature Threshold
            </p>
            <p className="text-3xl font-bold mt-2">
              {REQUIRED_THRESHOLD}/{TOTAL_VALIDATORS}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              Multisig required for actions
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Voting Power Distribution
            </p>
            <p className="text-3xl font-bold mt-2">Equal</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              200K TGV per validator
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Voting Period</p>
            <p className="text-3xl font-bold mt-2">Immediate</p>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              On 3-of-5 threshold
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link href="/actions/propose_add_validator">
            <button className="w-full px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 font-semibold transition-colors">
              ➕ Add Validator
            </button>
          </Link>
          <Link href="/actions/propose_remove_validator">
            <button className="w-full px-6 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 font-semibold transition-colors">
              ➖ Remove Validator
            </button>
          </Link>
        </div>

        {/* Validators Table */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden card-shadow">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold">Validators ({active}/{total})</h2>
          </div>

          {isLoading ? (
            <div className="p-6 text-center text-slate-600 dark:text-slate-400">
              Loading validators...
            </div>
          ) : !validators || validators.length === 0 ? (
            <div className="p-6 text-center text-slate-600 dark:text-slate-400">
              No validators found
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {validators.map((validator, index) => (
                <div key={validator.address}>
                  <button
                    onClick={() =>
                      setExpandedValidator(
                        expandedValidator === validator.address ? null : validator.address
                      )
                    }
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{validator.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500">
                            {formatAddress(validator.address)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold">{formatNumber(validator.votingPower / 1000)}K TGV</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500">Voting Power</p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          validator.status === "ACTIVE"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {validator.status}
                      </span>
                      <span className="text-slate-400">
                        {expandedValidator === validator.address ? "▼" : "▶"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedValidator === validator.address && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Wallet Address
                          </p>
                          <p className="font-mono text-xs break-all">{validator.address}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Voting Power
                          </p>
                          <p className="text-lg font-bold">
                            {formatNumber(validator.votingPower / 1000)}K TGV
                          </p>
                        </div>

                        {validator.joinedAt && (
                          <div>
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                              Joined
                            </p>
                            <p>
                              {new Date(validator.joinedAt * 1000).toLocaleDateString()}
                            </p>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Status
                          </p>
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                              validator.status === "ACTIVE"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }`}
                          >
                            {validator.status}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        {validator.status === "ACTIVE" && (
                          <Link href={`/actions/propose_remove_validator?address=${validator.address}`}>
                            <button className="px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 text-sm font-medium transition-colors">
                              Remove
                            </button>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Governance Info */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Threshold Info */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <h3 className="text-lg font-semibold mb-4">Signature Threshold</h3>
            <div className="space-y-3 text-sm">
              <p>
                <span className="text-slate-600 dark:text-slate-400">Required Signatures:</span>
                <span className="font-bold ml-2">{REQUIRED_THRESHOLD} of {TOTAL_VALIDATORS}</span>
              </p>
              <p>
                <span className="text-slate-600 dark:text-slate-400">Current Validators:</span>
                <span className="font-bold ml-2">{active} Active</span>
              </p>
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                <p className="text-slate-600 dark:text-slate-400 mb-2">This threshold applies to:</p>
                <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                  <li>✓ Governance proposals</li>
                  <li>✓ Emergency actions</li>
                  <li>✓ Ownership transfers</li>
                  <li>✓ Contract upgrades</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Thresholds */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
            <h3 className="text-lg font-semibold mb-4">Action Thresholds</h3>
            <div className="space-y-3">
              {[
                { name: "Payouts", threshold: 3 },
                { name: "Rebalancing", threshold: 3 },
                { name: "Staking", threshold: 3 },
                { name: "Upgrades", threshold: 5 },
                { name: "Minting", threshold: 3 },
              ].map((action) => (
                <div
                  key={action.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                >
                  <span className="text-sm font-medium">{action.name}</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {action.threshold}/{TOTAL_VALIDATORS}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/actions/propose_threshold_change">
              <button className="mt-4 w-full px-4 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 text-sm font-medium transition-colors">
                Change Threshold
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
