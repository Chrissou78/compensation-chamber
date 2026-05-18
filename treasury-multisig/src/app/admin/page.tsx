// src/app/admin/page.tsx
"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useAdminOverview } from "@/hooks/useAdmin";
import { formatNumber, formatAddress } from "@/lib/utils";
import { useAppStore } from "@/store";
import { DashboardSkeleton } from "@/components/Skeleton";
import { SupplyMeter } from "@/components/SupplyMeter";
import { ExportButton } from "@/components/ExportButton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users, Coins, Shield, Ban, ChevronRight, TrendingUp, Percent,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { isConnected } = useAccount();
  const overview = useAdminOverview();
  const resolveLabel = useAppStore((s) => s.resolveAddressLabel);

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to access the admin panel</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Token supply, validators, and governance overview
          </p>
        </div>
        {overview.recentMints.length > 0 && (
          <ExportButton
            data={overview.recentMints.map((m) => ({
              to: m.to,
              amount: m.amount,
              block: m.blockNumber,
              txHash: m.txHash,
            }))}
            filename="admin-mints"
            label="Export Mints"
          />
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>TGV Minted</CardDescription>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(overview.totalMinted, 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {formatNumber(overview.maxSupply, 0)} max supply
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Circulation</CardDescription>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <SupplyMeter minted={overview.totalMinted} maxSupply={overview.maxSupply} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Validators</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overview.validatorsActive}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}/ {overview.validatorsTotal}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">active validators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Blacklisted</CardDescription>
            <Ban className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.blacklistedAddresses}</div>
            <p className="text-xs text-muted-foreground mt-1">addresses blocked</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/admin/validators">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Manage Validators</div>
                <div className="text-[11px] text-muted-foreground">Add, remove, blacklist</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/admin/tokens">
            <div className="flex items-center gap-3">
              <Coins className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Token Minting</div>
                <div className="text-[11px] text-muted-foreground">View mint history</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>

        <Button variant="outline" className="h-auto py-4 justify-between" asChild>
          <Link href="/admin/blacklist">
            <div className="flex items-center gap-3">
              <Ban className="h-5 w-5" />
              <div className="text-left">
                <div className="text-sm font-medium">Blacklist</div>
                <div className="text-[11px] text-muted-foreground">Manage blocked addresses</div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Recent mints */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Mints</CardTitle>
          <CardDescription>Latest TGV token minting events</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.recentMints.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No mint events found</p>
          ) : (
            <div className="space-y-2">
              {overview.recentMints.map((mint) => (
                <div
                  key={mint.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {resolveLabel(mint.to) || (
                        <span className="font-mono">{formatAddress(mint.to)}</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">Block #{mint.blockNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatNumber(mint.amount, 0)} TGV</p>
                    <a
                      href={`https://amoy.polygonscan.com/tx/${mint.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      View tx →
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
