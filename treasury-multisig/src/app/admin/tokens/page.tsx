// src/app/admin/tokens/page.tsx
"use client";

import Link from "next/link";
import { useTokenSupply, useMintHistory } from "@/hooks/useAdmin";
import { formatAddress, formatNumber } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, ExternalLink } from "lucide-react";

export default function AdminTokensPage() {
  const { data: supply, isLoading: supplyLoading } = useTokenSupply();
  const { data: mints, isLoading: mintsLoading } = useMintHistory();

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin"><ArrowLeft className="h-3 w-3 mr-1" /> Admin</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Token Minting</h1>
        <p className="text-sm text-muted-foreground mt-1">GovernanceTokenV2 (TGV) supply and mint history</p>
      </div>

      {/* Supply stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Minted</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(supply?.totalMinted ?? 0, 0)} TGV</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Max Supply</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(supply?.maxSupply ?? 1_000_000, 0)} TGV</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Minted %</CardDescription></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(supply?.circulatingPct ?? 0).toFixed(1)}%</div>
            <div className="w-full bg-secondary rounded-full h-2 mt-2">
              <div className="bg-primary rounded-full h-2" style={{ width: `${Math.min(supply?.circulatingPct ?? 0, 100)}%` }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mint history table */}
      <Card>
        <CardHeader>
          <CardTitle>Mint History</CardTitle>
          <CardDescription>All TGV minting events on-chain</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {mintsLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : !mints || mints.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No mint events found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Recipient</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Block</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {mints.map((m) => (
                    <tr key={m.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-6 py-3 font-mono text-xs">{formatAddress(m.to)}</td>
                      <td className="px-6 py-3 font-bold">{formatNumber(m.amount, 0)} TGV</td>
                      <td className="px-6 py-3 text-muted-foreground">#{m.blockNumber}</td>
                      <td className="px-6 py-3 text-right">
                        <a href={`https://amoy.polygonscan.com/tx/${m.txHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5 inline" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
