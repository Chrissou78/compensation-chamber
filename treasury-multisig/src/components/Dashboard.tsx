"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import Link from "next/link";
import { formatNumber, formatAddress } from "@/lib/utils";
import { TreasuryBalance, Proposal } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  CircleDot,
  Hexagon,
  ScrollText,
  Fuel,
  PauseCircle,
  ChevronRight,
  ArrowUpRight,
  Shield,
} from "lucide-react";

export function Dashboard() {
  const { address, isConnected } = useAccount();
  const [balance] = useState<TreasuryBalance>({
    usdc: 125000,
    usdt: 85000,
    matic: 50,
    total: 210000,
  });
  const [pendingProposals, setPendingProposals] = useState<Proposal[]>([]);
  const [gasStatus] = useState({
    healthy: 7,
    warning: 1,
    critical: 1,
  });

  useEffect(() => {
    setPendingProposals([
      {
        id: "1",
        title: "Add New Validator",
        description: "Proposal to add CFO as validator",
        targets: [],
        values: [],
        calldatas: [],
        startBlock: 1000,
        endBlock: 2000,
        forVotes: 2,
        againstVotes: 0,
        abstainVotes: 0,
        canceled: false,
        executed: false,
        state: "Active",
        severity: "CRITICAL",
        thresholdReachedAt: undefined,
        readyForExecutionAt: undefined,
      },
    ]);
  }, []);

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Shield className="h-8 w-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Treasury Multisig
          </h1>
          <p className="text-sm text-muted-foreground mb-8">
            Connect your wallet to access the governance interface and manage
            treasury operations.
          </p>
          <p className="text-xs text-muted-foreground">
            Use the Connect Wallet button in the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {formatAddress(address!)}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Total Balance</CardDescription>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(balance.total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(balance.usdc + balance.usdt)} in stablecoins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>USDC</CardDescription>
            <CircleDot className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(balance.usdc)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((balance.usdc / balance.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>USDT</CardDescription>
            <CircleDot className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${formatNumber(balance.usdt)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((balance.usdt / balance.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>MATIC</CardDescription>
            <Hexagon className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(balance.matic)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Native gas token
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Active Proposals */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Active Proposals</CardTitle>
              <CardDescription>
                {pendingProposals.length} awaiting action
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/proposals">
                View all
                <ChevronRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No active proposals
              </p>
            ) : (
              <div className="space-y-3">
                {pendingProposals.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <ScrollText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {proposal.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {proposal.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {proposal.forVotes}/3
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          signatures
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                          proposal.severity === "CRITICAL"
                            ? "bg-red-500/10 text-red-400 ring-red-500/20"
                            : proposal.severity === "IMPORTANT"
                              ? "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                              : "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                        }`}
                      >
                        {proposal.severity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gas Reserves */}
        <Card>
          <CardHeader>
            <CardTitle>Gas Reserves</CardTitle>
            <CardDescription>Contract gas status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-sm">Healthy</span>
                </div>
                <span className="text-sm font-semibold">
                  {gasStatus.healthy}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-sm">Warning</span>
                </div>
                <span className="text-sm font-semibold">
                  {gasStatus.warning}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <span className="text-sm">Critical</span>
                </div>
                <span className="text-sm font-semibold">
                  {gasStatus.critical}
                </span>
              </div>

              <div className="border-t border-border pt-4 mt-4">
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/treasury">
                    Manage reserves
                    <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Emergency controls and common operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="destructive"
              className="h-auto py-3 justify-start"
              asChild
            >
              <Link href="/actions/execute_pause">
                <PauseCircle className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">Emergency Pause</div>
                  <div className="text-[11px] opacity-70">
                    Halt all operations
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 justify-start"
              asChild
            >
              <Link href="/actions/execute_emergency_refill">
                <Fuel className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">Emergency Refill</div>
                  <div className="text-[11px] text-muted-foreground">
                    Top up gas reserves
                  </div>
                </div>
              </Link>
            </Button>

            <Button
              variant="outline"
              className="h-auto py-3 justify-start"
              asChild
            >
              <Link href="/proposals">
                <ScrollText className="h-4 w-4 mr-2" />
                <div className="text-left">
                  <div className="text-sm font-medium">View Proposals</div>
                  <div className="text-[11px] text-muted-foreground">
                    Review & vote
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
