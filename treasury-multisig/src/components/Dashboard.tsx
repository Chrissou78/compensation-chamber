"use client"

import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import Link from "next/link"
import { formatNumber, formatAddress } from "@/lib/utils"
import { TreasuryBalance, Proposal } from "@/types"

export function Dashboard() {
  const { address, isConnected } = useAccount()
  const [balance, setBalance] = useState<TreasuryBalance>({
    usdc: 125000,
    usdt: 85000,
    matic: 50,
    total: 210000,
  })
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([])
  const [gasStatus, setGasStatus] = useState({
    healthy: 7,
    warning: 1,
    critical: 1,
  })

  useEffect(() => {
    // Simulate loading data
    // In production, use useProposals hook and contract queries
    setPendingProposals([
      {
        id: "1",
        title: "Add New Validator",
        description: "Proposal to add CFO as validator",
        targets: [],
        values: [],
        calldatas: [],
        startBlock: 1000,
        endBlock: 2000,
        forVotes: 2,
        againstVotes: 0,
        abstainVotes: 0,
        canceled: false,
        executed: false,
        state: "Active",
        severity: "CRITICAL",
        thresholdReachedAt: undefined,
        readyForExecutionAt: undefined,
      },
    ])
  }, [])

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Treasury Multisig</h1>
          <p className="text-slate-300 mb-8">
            Connect your wallet to access the governance interface
          </p>
          <p className="text-sm text-slate-400">Use the Connect Wallet button in the navbar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pt-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Welcome, {formatAddress(address!)}
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Balance */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Balance
              </p>
              <p className="text-2xl font-bold mt-2">
                ${formatNumber(balance.total)}
              </p>
            </div>
            <span className="text-4xl">💰</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-4">
            {balance.usdc + balance.usdt > 0
              ? `${formatNumber(balance.usdc + balance.usdt)} stablecoins`
              : "No stablecoins"}
          </p>
        </div>

        {/* USDC */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">USDC</p>
              <p className="text-2xl font-bold mt-2">${formatNumber(balance.usdc)}</p>
            </div>
            <span className="text-4xl">🔵</span>
          </div>
        </div>

        {/* USDT */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">USDT</p>
              <p className="text-2xl font-bold mt-2">${formatNumber(balance.usdt)}</p>
            </div>
            <span className="text-4xl">🟢</span>
          </div>
        </div>

        {/* MATIC */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">MATIC</p>
              <p className="text-2xl font-bold mt-2">{formatNumber(balance.matic)} MATIC</p>
            </div>
            <span className="text-4xl">🟣</span>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Pending Proposals */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Pending Proposals</h3>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-3xl font-bold">{pendingProposals.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            {pendingProposals.length > 0
              ? `${pendingProposals.length} awaiting action`
              : "No pending proposals"}
          </p>
          <Link
            href="/proposals"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All →
          </Link>
        </div>

        {/* Gas Reserve Status */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Gas Reserves</h3>
            <span className="text-2xl">⛽</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Healthy</span>
              <span className="text-lg font-bold text-green-600">{gasStatus.healthy}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Warning</span>
              <span className="text-lg font-bold text-yellow-600">{gasStatus.warning}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Critical</span>
              <span className="text-lg font-bold text-red-600">{gasStatus.critical}</span>
            </div>
          </div>
          <Link
            href="/treasury"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Manage →
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Quick Actions</h3>
            <span className="text-2xl">⚡</span>
          </div>
          <div className="space-y-2">
            <Link
              href="/actions/execute_pause"
              className="block text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
            >
              🚨 Emergency Pause
            </Link>
            <Link
              href="/actions/execute_emergency_refill"
              className="block text-sm text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 font-medium"
            >
              ⛽ Emergency Refill
            </Link>
            <Link
              href="/proposals"
              className="block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              🗳️ View Proposals
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Proposals */}
      {pendingProposals.length > 0 && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <h3 className="font-semibold mb-4">Active Proposals</h3>
          <div className="space-y-3">
            {pendingProposals.slice(0, 3).map((proposal) => (
              <div
                key={proposal.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium">{proposal.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {proposal.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {proposal.forVotes}/{3} votes
                    </p>
                    <p className="text-xs text-slate-500">
                      {proposal.state}
                    </p>
                  </div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    proposal.severity === "CRITICAL"
                      ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  }`}>
                    {proposal.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/proposals"
            className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All Proposals →
          </Link>
        </div>
      )}
    </div>
  )
}
