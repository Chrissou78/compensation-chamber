// src/app/funds/page.tsx
"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useWalletOverview } from "@/hooks/useFunds";
import { useTreasuryBalance, useAccumulatedFees, useGasReserves } from "@/hooks/useTreasury";
import { formatNumber, formatAddress } from "@/lib/utils";
import { useAppStore } from "@/store";
import { DashboardSkeleton } from "@/components/Skeleton";
import { BalanceChart } from "@/components/BalanceChart";
import { GasChart } from "@/components/GasChart";
import { ExportButton } from "@/components/ExportButton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign, Wallet, Receipt, Fuel, Coins, ChevronRight,
} from "lucide-react";

export default function FundsOverviewPage() {
  const { isConnected } = useAccount();
  const { data: balance, isLoading: balLoading } = useTreasuryBalance();
  const { data: wallets, isLoading: walletsLoading } = useWalletOverview();
  const fees = useAccumulatedFees();
  const { data: gasReserves } = useGasReserves();
  const resolveLabel = useAppStore((s) => s.resolveAddressLabel);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to view funds flow</p>
      </div>
    );
  }

  if (balLoading && walletsLoading) return <DashboardSkeleton />;

  const totalGas = gasReserves?.reduce((s, r) => s + r.currentBalance, 0) ?? 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Funds Flow</h1>
          <p className="text-sm text-muted-foreground mt-1">Treasury balances, payouts, and fund allocation</p>
        </div>
        {wallets && wallets.length > 0 && (
          <ExportButton
            data={wallets.map((w) => ({
              name: w.name,
              address: w.address,
              usdc: w.usdc,
              usdt: w.usdt,
              matic: w.matic,
              total: w.total,
            }))}
            filename="funds-wallets"
          />
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Total Stablecoins</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(balance?.total ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Accumulated Fees</CardDescription>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${formatNumber(fees.usdc + fees.usdt)}</div>
            <p className="text-xs text-muted-foreground mt-1">USDC: ${formatNumber(fees.usdc)} · USDT: ${formatNumber(fees.usdt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Total Gas Reserves</CardDescription>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalGas)} MATIC</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Tracked Wallets</CardDescription>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wallets?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Treasury Allocation</CardTitle>
            <CardDescription>Stablecoin and MATIC distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <BalanceChart
              usdc={balance?.usdc ?? 0}
              usdt={balance?.usdt ?? 0}
              matic={balance?.matic ?? 0}
            />
          </CardContent>
        </Card>
        {gasReserves && gasReserves.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Gas Reserves</CardTitle>
              <CardDescription>MATIC balance per contract vs target</CardDescription>
            </CardHeader>
            <CardContent>
              <GasChart reserves={gasReserves} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Wallet breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Wallet Balances</CardTitle>
            <CardDescription>Stablecoin and MATIC holdings per contract</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/funds/wallets">View details <ChevronRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Wallet</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">USDC</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">USDT</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">MATIC</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Total USD</th>
                </tr>
              </thead>
              <tbody>
                {wallets?.map((w) => (
                  <tr key={w.address} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-6 py-3">
                      <div className="font-medium">{resolveLabel(w.address) || w.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{formatAddress(w.address)}</div>
                    </td>
                    <td className="px-6 py-3 text-right">${formatNumber(w.usdc)}</td>
                    <td className="px-6 py-3 text-right">${formatNumber(w.usdt)}</td>
                    <td className="px-6 py-3 text-right">{formatNumber(w.matic)}</td>
                    <td className="px-6 py-3 text-right font-bold">${formatNumber(w.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Quick nav */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/funds/payouts">
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Payout Tracking</div>
                <div className="text-[11px] text-muted-foreground">View executed orders</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/funds/gas">
            <div className="flex items-center gap-3">
              <Fuel className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Gas Reserves</div>
                <div className="text-[11px] text-muted-foreground">Contract gas levels</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/funds/fees">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Fee Accumulation</div>
                <div className="text-[11px] text-muted-foreground">Swap history & fees</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
