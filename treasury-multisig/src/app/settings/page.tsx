"use client"

import { useState } from "react"
import { useAccount, useChainId, useSwitchChain } from "wagmi"
import { NETWORKS, CONTRACT_ADDRESSES } from "@/lib/constants"
import { formatAddress } from "@/lib/utils"

export default function SettingsPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { chains, switchChain } = useSwitchChain()
  const [copied, setCopied] = useState<string | null>(null)

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Configure your multisig wallet preferences
          </p>
        </div>

        {/* Wallet Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Wallet</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Connected Wallet
              </p>
              {isConnected && address ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <span className="w-2 h-2 rounded-full bg-green-600"></span>
                  <span className="font-mono text-sm">{formatAddress(address)}</span>
                  <button
                    onClick={() => handleCopy(address, "address")}
                    className="ml-auto text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                  >
                    {copied === "address" ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    No wallet connected. Use the Connect Wallet button in the navbar.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Network Section */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Network</h2>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Current Network
              </p>
              <p className="text-base font-semibold">
                {chainId === NETWORKS.AMOY
                  ? "Polygon Amoy (Testnet)"
                  : chainId === NETWORKS.POLYGON
                    ? "Polygon Mainnet"
                    : "Ethereum Mainnet"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Chain ID: {chainId}</p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Switch Network
              </p>
              <div className="flex flex-wrap gap-2">
                {chains
                  .filter(
                    (c) =>
                      [NETWORKS.AMOY, NETWORKS.POLYGON, NETWORKS.ETHEREUM].includes(
                        c.id
                      )
                  )
                  .map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => switchChain({ chainId: chain.id })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        chainId === chain.id
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {chain.name}
                    </button>
                  ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                ⚠️ Most features work on Polygon Amoy Testnet. Switch to testnet to test multisig functionality.
              </p>
            </div>
          </div>
        </div>

        {/* Contract Addresses */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Contract Addresses</h2>

          <div className="space-y-3">
            {Object.entries(CONTRACT_ADDRESSES).map(([key, address]) => (
              <div key={key} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      {key}
                    </p>
                    <p className="font-mono text-xs mt-1 break-all text-slate-700 dark:text-slate-300">
                      {address === "0x" ? "Not configured" : address}
                    </p>
                  </div>
                  {address !== "0x" && (
                    <button
                      onClick={() => handleCopy(address, key)}
                      className="ml-2 text-xs px-2 py-1 rounded bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 whitespace-nowrap"
                    >
                      {copied === key ? "✓" : "Copy"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signature Method */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Signature Method</h2>

          <div className="space-y-3">
            {[
              {
                id: "local",
                name: "Local Wallet",
                description: "Sign with connected wallet (MetaMask, etc.)",
              },
              {
                id: "fireblocks",
                name: "Fireblocks",
                description: "Enterprise-grade custody and signing",
              },
              {
                id: "kms",
                name: "AWS KMS",
                description: "Hardware Security Module integration",
              },
            ].map((method) => (
              <label
                key={method.id}
                className="flex items-center p-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <input
                  type="radio"
                  name="signature-method"
                  value={method.id}
                  defaultChecked={method.id === "local"}
                  className="w-4 h-4"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium">{method.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">{method.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* API Endpoints */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 card-shadow">
          <h2 className="text-lg font-semibold mb-4">API Endpoints</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                Subgraph URL
              </p>
              <p className="font-mono text-xs break-all p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {process.env.NEXT_PUBLIC_SUBGRAPH_URL || "Not configured"}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                RPC Endpoints
              </p>
              <div className="space-y-2">
                <div className="font-mono text-xs break-all p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Amoy: {process.env.NEXT_PUBLIC_RPC_AMOY}
                </div>
                <div className="font-mono text-xs break-all p-2 rounded bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Mainnet: {process.env.NEXT_PUBLIC_RPC_MAINNET}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
