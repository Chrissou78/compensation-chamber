// src/app/funds/rebalancing/page.tsx
"use client";

import Link from "next/link";
import { usePayoutHistory } from "@/hooks/useFunds";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowLeftRight, ExternalLink } from "lucide-react";

export default function FundsRebalancingPage() {
  const { data: allPayouts, isLoading } = usePayoutHistory();
  const rebalances = allPayouts?.filter((p) => p.type === "Rebalance") ?? [];

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Rebalancing History</h1>
        <p className="text-sm text-muted-foreground mt-1">{rebalances.length} rebalancing operations</p>
      </div>

      {isLoading ? <CardSkeleton /> : rebalances.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ArrowLeftRight className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No rebalancing events found</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {rebalances.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-6 py-4 hover:bg-accent/30">
                  <div>
                    <p className="text-sm font-medium">→ {formatAddress(r.recipient)}</p>
                    <p className="text-xs text-muted-foreground">Block #{r.blockNumber}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold">${formatNumber(r.amount)}</span>
                    <a href={`https://amoy.polygonscan.com/tx/${r.txHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
