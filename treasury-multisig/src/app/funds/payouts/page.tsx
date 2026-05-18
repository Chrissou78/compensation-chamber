// src/app/funds/payouts/page.tsx
"use client";

import Link from "next/link";
import { usePayoutHistory } from "@/hooks/useFunds";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, ExternalLink } from "lucide-react";

export default function FundsPayoutsPage() {
  const { data: payouts, isLoading } = usePayoutHistory();

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payout Tracking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {payouts?.length ?? 0} executed treasury orders
        </p>
      </div>

      {isLoading ? <CardSkeleton /> : !payouts || payouts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Receipt className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No payouts found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Type</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Recipient</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Block</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">TX</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-6 py-3">
                        <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                          p.type === "Payout" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : p.type === "Rebalance" ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 ring-purple-500/20"
                        }`}>{p.type}</span>
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">{formatAddress(p.recipient)}</td>
                      <td className="px-6 py-3 text-right font-bold">${formatNumber(p.amount)}</td>
                      <td className="px-6 py-3 text-right text-muted-foreground">#{p.blockNumber}</td>
                      <td className="px-6 py-3 text-right">
                        <a href={`https://amoy.polygonscan.com/tx/${p.txHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5 inline" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
