// src/app/monitoring/events/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRecentEvents } from "@/hooks/useEvents";
import { formatAddress } from "@/lib/utils";
import { ExportButton } from "@/components/ExportButton";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, Filter, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 25;

const EVENT_COLORS: Record<string, string> = {
  ProposalCreated: "text-blue-400",
  VoteCast: "text-purple-400",
  ProposalExecuted: "text-emerald-400",
  ProposalCanceled: "text-red-400",
  Paused: "text-amber-400",
  Unpaused: "text-emerald-400",
  OrderExecuted: "text-blue-400",
  GasRefilled: "text-cyan-400",
  ValidatorAdded: "text-emerald-400",
  ValidatorRemoved: "text-red-400",
};

export default function MonitoringEventsPage() {
  const { data: events, isLoading } = useRecentEvents();
  const [search, setSearch] = useState("");
  const [contractFilter, setContractFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const contractNames = useMemo(() => {
    if (!events) return [];
    return Array.from(new Set(events.map((e) => e.contractName)));
  }, [events]);

  const filtered = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      if (contractFilter && e.contractName !== contractFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.eventName.toLowerCase().includes(q) ||
          e.contractName.toLowerCase().includes(q) ||
          e.transactionHash.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [events, contractFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/monitoring"><ArrowLeft className="h-3 w-3 mr-1" /> Monitoring</Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Event Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} decoded contract events across the treasury system
          </p>
        </div>
        {filtered.length > 0 && (
          <ExportButton
            data={filtered.map((e) => ({
              contract: e.contractName,
              event: e.eventName,
              block: String(e.blockNumber ?? ""),
              txHash: e.transactionHash,
              args: JSON.stringify(e.args ?? {}),
            }))}
            filename="event-log"
          />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search events, contracts, tx hash..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full rounded-md border border-border bg-background pl-10 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setContractFilter(null); setPage(0); }}
            className={`text-xs font-medium px-3 py-1.5 rounded-md ring-1 ring-inset transition-colors ${
              !contractFilter ? "bg-primary/10 text-primary ring-primary/30" : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
            }`}
          >All</button>
          {contractNames.map((c) => (
            <button
              key={c}
              onClick={() => { setContractFilter(contractFilter === c ? null : c); setPage(0); }}
              className={`text-xs font-medium px-3 py-1.5 rounded-md ring-1 ring-inset transition-colors ${
                contractFilter === c ? "bg-primary/10 text-primary ring-primary/30" : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
              }`}
            >{c}</button>
          ))}
        </div>
      </div>

      {/* Event table */}
      {isLoading ? <CardSkeleton /> : (
        <Card>
          <CardContent className="p-0">
            {paged.length === 0 ? (
              <p className="text-sm text-muted-foreground py-16 text-center">No events match your filters</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Block</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Contract</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Event</th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Args</th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">TX</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                        <td className="px-6 py-3 font-mono text-xs text-muted-foreground">#{e.blockNumber?.toString()}</td>
                        <td className="px-6 py-3">
                          <span className="inline-flex rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium">
                            {e.contractName}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <span className={`text-xs font-medium ${EVENT_COLORS[e.eventName] || "text-foreground"}`}>
                            {e.eventName}
                          </span>
                        </td>
                        <td className="px-6 py-3 max-w-xs truncate text-xs font-mono text-muted-foreground">
                          {e.args ? Object.entries(e.args).map(([k, v]) => `${k}=${typeof v === "bigint" ? v.toString() : String(v)}`).join(", ").slice(0, 80) : "—"}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <a href={`https://amoy.polygonscan.com/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3.5 w-3.5 inline" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · {filtered.length} events
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}>
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
