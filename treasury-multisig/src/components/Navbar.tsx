"use client"

import Link from "next/link"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useChainId } from "wagmi"
import { formatAddress } from "@/lib/utils"
import { NETWORKS } from "@/lib/constants"

export function Navbar() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()

  const isAmoy = chainId === NETWORKS.AMOY
  const isPolygon = chainId === NETWORKS.POLYGON

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/95">
      <div className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-2xl">💎</span>
          <span className="hidden sm:inline">Treasury Multisig</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex gap-6">
          <Link
            href="/proposals"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Proposals
          </Link>
          <Link
            href="/governance"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Governance
          </Link>
          <Link
            href="/treasury"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Treasury
          </Link>
          <Link
            href="/settings"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Settings
          </Link>
        </div>

        {/* Network Status & Wallet */}
        <div className="flex items-center gap-4">
          {/* Network Indicator */}
          {isConnected && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
              <div className={`w-2 h-2 rounded-full ${isAmoy ? "bg-green-500" : isPolygon ? "bg-blue-500" : "bg-red-500"}`} />
              <span className="text-xs font-medium">
                {isAmoy ? "Amoy" : isPolygon ? "Polygon" : "Unknown"}
              </span>
            </div>
          )}

          {/* Wallet Address */}
          {isConnected && address && (
            <div className="hidden xs:block px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium">
              {formatAddress(address)}
            </div>
          )}

          {/* Connect Button */}
          <ConnectButton />
        </div>
      </div>

      {/* Mobile Menu - Hidden by default, can be expanded */}
      {isConnected && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-col gap-2">
          <Link href="/proposals" className="text-sm font-medium hover:text-primary">
            Proposals
          </Link>
          <Link href="/governance" className="text-sm font-medium hover:text-primary">
            Governance
          </Link>
          <Link href="/treasury" className="text-sm font-medium hover:text-primary">
            Treasury
          </Link>
          <Link href="/settings" className="text-sm font-medium hover:text-primary">
            Settings
          </Link>
        </div>
      )}
    </nav>
  )
}
