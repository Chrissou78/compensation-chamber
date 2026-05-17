"use client"

import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { CONTRACT_ADDRESSES } from "@/lib/constants"
import { formatAddress } from "@/lib/utils"

export default function TreasuryPage() {
  const { isConnected } = useAccount()
  const [expandedContract, setExpandedContract] = useState<string | null>(null)

  const contracts = [
    {
      name: "VariableTimelockController",
      address: CONTRACT_ADDRESSES.VARIABLE_TIMELOCK,
      icon: "⏱️",
      description: "Severity-based timelock for scheduled operations",
      actions: ["Update Delays"],
    },
    {
      name: "GovernanceTokenV2",
      address: CONTRACT_ADDRESSES.GOVERNANCE_TOKEN,
      icon: "🪙",
      description: "1M TGV token with voting rights and blacklist",
      actions: ["Mint Tokens", "Blacklist Address"],
    },
    {
      name: "UpgradeGovernor",
      address: CONTRACT_ADDRESSES.UPGRADE_GOVERNOR,
      icon: "🏛️",
      description: "Governance with immediate execution on threshold",
      actions: ["View Proposals", "Vote"],
    },
    {
      name: "DynamicValidatorRegistry",
      address: CONTRACT_ADDRESSES.VALIDATOR_REGISTRY,
      icon: "👥",
      description: "Manages validator set and action thresholds",
      actions: ["Add Validator", "Remove Validator"],
    },
    {
      name: "TreasuryController",
      address: CONTRACT_ADDRESSES.TREASURY_CONTROLLER,
      icon: "💰",
      description: "Core order execution with EIP-712 validation",
      actions: ["Pause", "Unpause", "Emergency Withdraw"],
    },
    {
      name: "GasRefiller",
      address: CONTRACT_ADDRESSES.GAS_REFILLER,
      icon: "⛽",
      description: "Multi-wallet management and automatic gas refill",
      actions: ["Emergency Refill", "View Gas Reserves"],
    },
    {
      name: "PayoutExecutor",
      address: "0x...",
      icon: "💸",
      description: "Executes payouts with country-specific limits",
      actions: ["View Payouts", "Set Limits"],
    },
    {
      name: "RebalancingExecutor",
      address: "0x...",
      icon: "🔄",
      description: "Cross-country wallet rebalancing",
      actions: ["View Schedule", "Manual Rebalance"],
    },
    {
      name: "StakingExecutor",
      address: "0x...",
      icon: "📈",
      description: "Staking position management with time locks",
      actions: ["View Positions", "Stake", "Unstake"],
    },
  ]

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Connect your wallet to manage treasury contracts
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Treasury</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage treasury contracts, ownership, and emergency controls
          </p>
        </div>

        {/* Emergency Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/actions/execute_pause">
            <button className="w-full px-6 py-4 rounded-lg bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 font-semibold transition-colors text-left">
              <span className="block text-2xl mb-2">⏸️</span>
              <span className="text-sm">Emergency Pause</span>
            </button>
          </Link>

          <Link href="/actions/execute_emergency_refill">
            <button className="w-full px-6 py-4 rounded-lg bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-700 dark:hover:bg-yellow-600 font-semibold transition-colors text-left">
              <span className="block text-2xl mb-2">⛽</span>
              <span className="text-sm">Emergency Refill</span>
            </button>
          </Link>

          <Link href="/actions/execute_withdraw">
            <button className="w-full px-6 py-4 rounded-lg bg-orange-600 text-white hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 font-semibold transition-colors text-left">
              <span className="block text-2xl mb-2">💸</span>
              <span className="text-sm">Emergency Withdraw</span>
            </button>
          </Link>
        </div>

        {/* Contracts Grid */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden card-shadow">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-semibold">Smart Contracts ({contracts.length})</h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {contracts.map((contract) => (
              <div key={contract.name}>
                <button
                  onClick={() =>
                    setExpandedContract(
                      expandedContract === contract.name ? null : contract.name
                    )
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{contract.icon}</span>
                      <h3 className="font-semibold">{contract.name}</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {contract.description}
                    </p>
                  </div>
                  <span className="text-slate-400 ml-4">
                    {expandedContract === contract.name ? "▼" : "▶"}
                  </span>
                </button>

                {/* Expanded Details */}
                {expandedContract === contract.name && (
                  <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-800">
                    <div className="space-y-4">
                      {contract.address !== "0x..." && (
                        <div>
                          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                            Contract Address
                          </p>
                          <p className="font-mono text-xs break-all bg-slate-100 dark:bg-slate-900 p-3 rounded">
                            {contract.address}
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                          Available Actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {contract.actions.map((action) => {
                            // Map action names to URLs
                            const actionMap: Record<string, string> = {
                              "View Proposals": "/proposals",
                              Vote: "/proposals",
                              "Add Validator": "/actions/propose_add_validator",
                              "Remove Validator": "/actions/propose_remove_validator",
                              "Mint Tokens": "/actions/propose_mint_tokens",
                              "Blacklist Address": "/actions/propose_blacklist_address",
                              Pause: "/actions/execute_pause",
                              Unpause: "/actions/execute_unpause",
                              "Emergency Refill": "/actions/execute_emergency_refill",
                              "Emergency Withdraw": "/actions/execute_withdraw",
                              "Update Delays": "/actions/propose_update_delay",
                              "View Payouts": "/",
                              "Set Limits": "/",
                              "View Schedule": "/",
                              "Manual Rebalance": "/",
                              "View Positions": "/",
                              Stake: "/",
                              Unstake: "/",
                              "View Gas Reserves": "/",
                            }
                            const href = actionMap[action] || "/"

                            return (
                              <Link key={action} href={href}>
                                <button className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 text-xs font-medium transition-colors">
                                  {action}
                                </button>
                              </Link>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ownership Transfer */}
        <div className="mt-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Transfer All Ownership</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Initiate a governance proposal to transfer all contracts to a new multisig wallet
              </p>
            </div>
            <Link href="/actions/propose_ownership_transfer">
              <button className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 font-semibold transition-colors">
                👑 Transfer Ownership
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
