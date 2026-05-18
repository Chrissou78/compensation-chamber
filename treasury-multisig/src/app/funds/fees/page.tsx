// src/app/funds/fees/page.tsx
"use client";

import Link from "next/link";
import { useAccumulatedFees } from "@/hooks/useTreasury";
import { useFeeSwapHistory } from "@/hooks/useFunds";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Coins, ExternalLink } from "lucide-react";

export default function FundsFeesPage() {
  const fees = useAccumulatedFees();
  const { data: swaps, isLoading } = useFeeSwapHistory();

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Accumulation</h1>
        <p className="text-sm text-muted-foreground mt-1">Treasury fees and swap history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>USDC Fees</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">${formatNumber(fees.usdc)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>USDT Fees</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">${formatNumber(fees.usdt)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Total Fees</CardDescription></CardHeader>
          <CardContent><div className="text-2xl font-bold">${formatNumber(fees.usdc + fees.usdt)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Swap History</CardTitle>
          <CardDescription>Fee → MATIC conversion events</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : !swaps || swaps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No swap events found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Token</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Fees In</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">MATIC Out</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Block</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {swaps.map((s) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-6 py-3 font-mono text-xs">{formatAddress(s.token)}</td>
                      <td className="px-6 py-3 text-right">${formatNumber(s.amountIn)}</td>
                      <td className="px-6 py-3 text-right">{formatNumber(s.amountOut)} MATIC</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">#{s.blockNumber}</td>
                      <td className="px-6 py-3 text-right">
                        <a href={`https://amoy.polygonscan.com/tx/${s.txHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
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
