// src/app/monitoring/health/page.tsx
"use client";

import Link from "next/link";
import { useContractStatuses, useSystemHealth } from "@/hooks/useMonitoring";
import { formatNumber } from "@/lib/utils";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, Heart, CheckCircle, AlertTriangle, XCircle, PauseCircle,
} from "lucide-react";

export default function MonitoringHealthPage() {
  const { data: statuses, isLoading } = useContractStatuses();
  const health = useSystemHealth();

  if (isLoading) return <DashboardSkeleton />;

  const healthColor =
    health.healthScore >= 80 ? "text-emerald-400" : health.healthScore >= 50 ? "text-amber-400" : "text-red-400";
  const healthBg =
    health.healthScore >= 80 ? "bg-emerald-500/10" : health.healthScore >= 50 ? "bg-amber-500/10" : "bg-red-500/10";

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/monitoring"><ArrowLeft className="h-3 w-3 mr-1" /> Monitoring</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Health</h1>
        <p className="text-sm text-muted-foreground mt-1">Comprehensive health check for all contracts</p>
      </div>

      {/* Health score */}
      <Card className={healthBg}>
        <CardContent className="py-8 text-center">
          <Heart className={`h-12 w-12 mx-auto mb-3 ${healthColor}`} />
          <div className={`text-5xl font-bold ${healthColor}`}>{health.healthScore}%</div>
          <p className="text-sm text-muted-foreground mt-2">
            {health.deployed} deployed · {health.pausedContracts} paused · {health.criticalGas} low gas
          </p>
        </CardContent>
      </Card>

      {/* Per-contract health */}
      <div className="space-y-3">
        {statuses?.map((s) => {
          let statusIcon = <CheckCircle className="h-5 w-5 text-emerald-400" />;
          let statusText = "Healthy";
          let statusColor = "border-emerald-500/20";

          if (!s.isDeployed) {
            statusIcon = <XCircle className="h-5 w-5 text-red-400" />;
            statusText = "Not Deployed";
            statusColor = "border-red-500/20";
          } else if (s.isPaused) {
            statusIcon = <PauseCircle className="h-5 w-5 text-amber-400" />;
            statusText = "Paused";
            statusColor = "border-amber-500/20";
          } else if (s.balance < 0.5) {
            statusIcon = <AlertTriangle className="h-5 w-5 text-amber-400" />;
            statusText = "Low Gas";
            statusColor = "border-amber-500/20";
          }

          return (
            <Card key={s.name} className={`border-l-4 ${statusColor}`}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  {statusIcon}
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{statusText} · {formatNumber(s.balance)} MATIC · {s.eventCount24h} events</p>
                  </div>
                </div>
                {s.isDeployed && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/monitoring/contracts/${s.address}`}>View</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
