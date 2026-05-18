// src/app/funds/gas/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { type Address } from "viem";
import { useGasReserves } from "@/hooks/useTreasury";
import { useRefillHistory } from "@/hooks/useFunds";
import { useRefillGas } from "@/hooks/useVoting";
import { useAppStore } from "@/store";
import { formatNumber, formatAddress } from "@/lib/utils";
import { GasChart } from "@/components/GasChart";
import { ExportButton } from "@/components/ExportButton";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Fuel, ExternalLink, Loader2, Zap } from "lucide-react";

const baseInput =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";

export default function FundsGasPage() {
  const { data: reserves, isLoading: reservesLoading } = useGasReserves();
  const { data: refills, isLoading: refillsLoading } = useRefillHistory();
  const { refillGas, isPending: isRefilling } = useRefillGas();
  const addToast = useAppStore((s) => s.addToast);
  const resolveLabel = useAppStore((s) => s.resolveAddressLabel);

  const [refillAddr, setRefillAddr] = useState("");
  const [refillAmount, setRefillAmount] = useState("");

  const handleRefill = () => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(refillAddr)) {
      addToast({ type: "error", title: "Invalid address" });
      return;
    }
    if (!refillAmount || Number(refillAmount) <= 0) {
      addToast({ type: "error", title: "Invalid amount" });
      return;
    }
    refillGas(refillAddr as Address, refillAmount);
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gas Reserve Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Contract gas levels, refill actions, and history</p>
        </div>
        {refills && refills.length > 0 && (
          <ExportButton
            data={refills.map((r) => ({
              contract: r.contractAddress,
              amount: r.amount,
              block: r.blockNumber,
              txHash: r.txHash,
            }))}
            filename="gas-refills"
            label="Export History"
          />
        )}
      </div>

      {/* Gas chart */}
      {reserves && reserves.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reserve Levels vs Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <GasChart reserves={reserves} />
          </CardContent>
        </Card>
      )}

      {/* Quick refill */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Refill</CardTitle>
          <CardDescription>Send MATIC to a contract for gas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Contract Address</label>
              <select
                value={refillAddr}
                onChange={(e) => setRefillAddr(e.target.value)}
                className={baseInput}
              >
                <option value="">Select contract...</option>
                {reserves?.map((r) => (
                  <option key={r.contractAddress} value={r.contractAddress}>
                    {resolveLabel(r.contractAddress) || r.contractName} ({formatNumber(r.currentBalance)} MATIC)
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Amount (MATIC)</label>
              <input
                type="number"
                step="0.01"
                value={refillAmount}
                onChange={(e) => setRefillAmount(e.target.value)}
                placeholder="1.0"
                className={baseInput}
              />
            </div>
          </div>
          <Button onClick={handleRefill} disabled={isRefilling || !refillAddr || !refillAmount}>
            {isRefilling ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Refilling...</> : <><Zap className="h-4 w-4 mr-2" /> Refill Gas</>}
          </Button>
        </CardContent>
      </Card>

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
                  <CardTitle className="text-sm">{resolveLabel(r.contractAddress) || r.contractName}</CardTitle>
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
                    <p className="text-sm font-medium">{resolveLabel(r.contractAddress) || <span className="font-mono">{formatAddress(r.contractAddress)}</span>}</p>
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
