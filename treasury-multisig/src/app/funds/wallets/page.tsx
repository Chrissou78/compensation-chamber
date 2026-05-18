// src/app/funds/wallets/page.tsx
"use client";

import Link from "next/link";
import { useWalletOverview } from "@/hooks/useFunds";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";

export default function FundsWalletsPage() {
  const { data: wallets, isLoading } = useWalletOverview();

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/funds"><ArrowLeft className="h-3 w-3 mr-1" /> Funds Flow</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Wallet Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Detailed balance breakdown per contract wallet</p>
      </div>

      {isLoading ? <CardSkeleton /> : (
        <div className="grid grid-cols-1 gap-4">
          {wallets?.map((w) => (
            <Card key={w.address}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">{w.name}</CardTitle>
                  <CardDescription className="font-mono">{w.address}</CardDescription>
                </div>
                <a href={`https://amoy.polygonscan.com/address/${w.address}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </a>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">USDC</p>
                    <p className="text-lg font-bold">${formatNumber(w.usdc)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">USDT</p>
                    <p className="text-lg font-bold">${formatNumber(w.usdt)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">MATIC</p>
                    <p className="text-lg font-bold">{formatNumber(w.matic)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total USD</p>
                    <p className="text-lg font-bold text-primary">${formatNumber(w.total)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
