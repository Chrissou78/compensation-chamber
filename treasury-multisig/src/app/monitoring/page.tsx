// src/app/monitoring/page.tsx
"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { useContractStatuses, useSystemHealth } from "@/hooks/useMonitoring";
import { formatNumber, formatAddress } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity, Heart, Server, Fuel, FileText, ChevronRight,
  CheckCircle, XCircle, PauseCircle, AlertTriangle,
} from "lucide-react";

export default function MonitoringDashboardPage() {
  const { isConnected } = useAccount();
  const { data: statuses, isLoading } = useContractStatuses();
  const health = useSystemHealth();

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to view monitoring</p>
      </div>
    );
  }

  if (isLoading) return <DashboardSkeleton />;

  const healthColor =
    health.healthScore >= 80 ? "text-emerald-400" : health.healthScore >= 50 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contract Monitoring</h1>
        <p className="text-sm text-muted-foreground mt-1">Real-time status of all treasury contracts</p>
      </div>

      {/* Health overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Health Score</CardDescription>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${healthColor}`}>{health.healthScore}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Deployed</CardDescription>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.deployed}/{health.totalContracts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Total Gas</CardDescription>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(health.totalGas)} MATIC</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Recent Events</CardDescription>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">in last ~5000 blocks</p>
          </CardContent>
        </Card>
      </div>

      {/* Contract status table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contract Status</CardTitle>
            <CardDescription>Deployment, balance, and event activity</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/monitoring/events">Event Log <ChevronRight className="h-3 w-3 ml-1" /></Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Contract</th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Balance</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Events</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {statuses?.map((s) => (
                  <tr key={s.name} className="border-b border-border last:border-0 hover:bg-accent/30">
                    <td className="px-6 py-4">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs font-mono text-muted-foreground">{formatAddress(s.address)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {!s.isDeployed ? (
                          <><XCircle className="h-4 w-4 text-red-400" /><span className="text-xs text-red-400">Not deployed</span></>
                        ) : s.isPaused ? (
                          <><PauseCircle className="h-4 w-4 text-amber-400" /><span className="text-xs text-amber-400">Paused</span></>
                        ) : s.balance < 0.5 ? (
                          <><AlertTriangle className="h-4 w-4 text-amber-400" /><span className="text-xs text-amber-400">Low gas</span></>
                        ) : (
                          <><CheckCircle className="h-4 w-4 text-emerald-400" /><span className="text-xs text-emerald-400">Healthy</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono">{formatNumber(s.balance)} MATIC</td>
                    <td className="px-6 py-4 text-right">{s.eventCount24h}</td>
                    <td className="px-6 py-4 text-right">
                      {s.isDeployed && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/monitoring/contracts/${s.address}`}>Details</Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" asChild>
        <Link href="/monitoring/health">
          <Heart className="h-4 w-4 mr-2" /> Full Health Report
        </Link>
      </Button>
    </div>
  );
}
