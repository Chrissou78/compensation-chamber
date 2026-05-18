// src/app/funds/gas/page.tsx
"use client";

import Link from "next/link";
import { useGasReserves } from "@/hooks/useTreasury";
import { useRefillHistory } from "@/hooks/useFunds";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Fuel, ExternalLink } from "lucide-react";

export default function FundsGasPage() {
  const { data: reserves, isLoading: reservesLoading } = useGasReserves();
  const { data: refills, isLoading: refillsLoading } = useRefillHistory();

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Gas Reserve Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Contract gas levels and refill history</p>
      </div>

      {/* Current reserves */}
      {reservesLoading ? <CardSkeleton /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reserves?.map((r) => {
            const pct = r.targetBalance > 0 ? (r.currentBalance / r.targetBalance) * 100 : 0;
            const status = r.currentBalance >= r.refillThreshold ? "healthy" : r.currentBalance > 0 ? "warning" : "critical";
            const barColor = status === "healthy" ? "bg-emerald-500" : status === "warning" ? "bg-amber-500" : "bg-red-500";

            return (
              <Card key={r.contractName}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{r.contractName}</CardTitle>
                  <CardDescription className="font-mono text-[11px]">{formatAddress(r.contractAddress)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-lg font-bold">{formatNumber(r.currentBalance)} MATIC</span>
                    <span className={`text-[11px] font-medium capitalize ${
                      status === "healthy" ? "text-emerald-400" : status === "warning" ? "text-amber-400" : "text-red-400"
                    }`}>{status}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className={`${barColor} rounded-full h-2 transition-all`} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">Target: {r.targetBalance} MATIC</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Refill history */}
      <Card>
        <CardHeader>
          <CardTitle>Refill History</CardTitle>
          <CardDescription>Recent gas refill transactions</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {refillsLoading ? (
            <div className="p-6"><CardSkeleton /></div>
          ) : !refills || refills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-12 text-center">No refill events found</p>
          ) : (
            <div className="divide-y divide-border">
              {refills.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30">
                  <div>
                    <p className="text-sm font-mono">{formatAddress(r.contractAddress)}</p>
                    <p className="text-xs text-muted-foreground">Block #{r.blockNumber}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold">{formatNumber(r.amount)} MATIC</span>
                    <a href={`https://amoy.polygonscan.com/tx/${r.txHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
