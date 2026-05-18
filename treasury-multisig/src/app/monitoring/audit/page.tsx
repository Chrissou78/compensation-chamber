// src/app/monitoring/audit/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRecentEvents } from "@/hooks/useEvents";
import { useProposals } from "@/hooks/useProposals";
import { formatAddress, formatNumber } from "@/lib/utils";
import { useAppStore } from "@/store";
import { ExportButton } from "@/components/ExportButton";
import { DashboardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, FileText, Shield, Clock, CheckCircle, XCircle,
  AlertTriangle, ExternalLink,
} from "lucide-react";

export default function AuditPage() {
  const { data: events, isLoading: eventsLoading } = useRecentEvents();
  const { data: proposals, isLoading: proposalsLoading } = useProposals();
  const resolveLabel = useAppStore((s) => s.resolveAddressLabel);

  const auditEntries = useMemo(() => {
    const entries: {
      id: string;
      timestamp: string;
      type: "proposal" | "vote" | "execution" | "emergency" | "admin";
      summary: string;
      details: string;
      txHash?: string;
      severity?: string;
    }[] = [];

    // From proposals
    proposals?.forEach((p) => {
      entries.push({
        id: `prop-${p.id}`,
        timestamp: p.createdAt ? new Date(p.createdAt * 1000).toISOString() : "Unknown",
        type: "proposal",
        summary: `Proposal #${p.id.slice(0, 8)}: ${p.title || p.description?.slice(0, 60) || "Untitled"}`,
        details: `State: ${p.state} · For: ${p.forVotes} · Against: ${p.againstVotes} · Abstain: ${p.abstainVotes}`,
        severity: p.severity,
      });
    });

    // From events
    events?.forEach((e) => {
      let type: typeof entries[0]["type"] = "admin";
      if (e.eventName.includes("Proposal")) type = "proposal";
      else if (e.eventName.includes("Vote")) type = "vote";
      else if (e.eventName.includes("Execute") || e.eventName.includes("Order")) type = "execution";
      else if (e.eventName.includes("Pause") || e.eventName.includes("Emergency")) type = "emergency";

      entries.push({
        id: e.id,
        timestamp: `Block #${e.blockNumber?.toString()}`,
        type,
        summary: `${e.contractName}: ${e.eventName}`,
        details: e.args
          ? Object.entries(e.args).map(([k, v]) => `${k}=${typeof v === "bigint" ? v.toString() : String(v)}`).join(", ")
          : "",
        txHash: e.transactionHash,
      });
    });

    return entries;
  }, [events, proposals]);

  const typeColors: Record<string, string> = {
    proposal: "bg-blue-500/10 text-blue-400 ring-blue-500/20",
    vote: "bg-purple-500/10 text-purple-400 ring-purple-500/20",
    execution: "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20",
    emergency: "bg-red-500/10 text-red-400 ring-red-500/20",
    admin: "bg-amber-500/10 text-amber-400 ring-amber-500/20",
  };

  const typeIcons: Record<string, React.ElementType> = {
    proposal: FileText,
    vote: Shield,
    execution: CheckCircle,
    emergency: AlertTriangle,
    admin: Clock,
  };

  if (eventsLoading && proposalsLoading) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/monitoring"><ArrowLeft className="h-3 w-3 mr-1" /> Monitoring</Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Trail</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete chronological record of governance actions and contract events
          </p>
        </div>
        {auditEntries.length > 0 && (
          <ExportButton
            data={auditEntries.map((e) => ({
              id: e.id,
              timestamp: e.timestamp,
              type: e.type,
              summary: e.summary,
              details: e.details,
              txHash: e.txHash ?? "",
              severity: e.severity ?? "",
            }))}
            filename="audit-trail"
            label="Export Audit"
          />
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["proposal", "vote", "execution", "emergency", "admin"] as const).map((type) => {
          const count = auditEntries.filter((e) => e.type === type).length;
          const Icon = typeIcons[type];
          return (
            <Card key={type}>
              <CardContent className="flex items-center gap-3 py-4">
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                <div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{type}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>{auditEntries.length} entries</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {auditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-16 text-center">No audit entries found</p>
          ) : (
            <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
              {auditEntries.map((entry) => {
                const Icon = typeIcons[entry.type] ?? Clock;
                return (
                  <div key={entry.id} className="flex items-start gap-4 px-6 py-4 hover:bg-accent/30">
                    <div className={`mt-0.5 rounded-full p-1.5 ring-1 ring-inset ${typeColors[entry.type]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{entry.summary}</p>
                        {entry.severity && (
                          <span className="text-[10px] font-medium rounded px-1.5 py-0.5 ring-1 ring-inset bg-secondary text-muted-foreground ring-border">
                            {entry.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.details}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">{entry.timestamp}</p>
                    </div>
                    {entry.txHash && (
                      <a
                        href={`https://amoy.polygonscan.com/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground shrink-0 mt-1"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
