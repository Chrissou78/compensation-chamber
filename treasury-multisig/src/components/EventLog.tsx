// src/components/EventLog.tsx
"use client";

import { useRecentEvents, ContractEvent } from "@/hooks/useEvents";
import { formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ScrollText,
  ShieldCheck,
  Landmark,
  Users,
  Fuel,
  ExternalLink,
} from "lucide-react";

const CONTRACT_ICONS: Record<string, React.ElementType> = {
  Governor: ScrollText,
  Treasury: Landmark,
  Registry: Users,
  GasRefiller: Fuel,
};

const EVENT_COLORS: Record<string, string> = {
  ProposalCreatedWithSeverity: "text-blue-400",
  ThresholdReached: "text-emerald-400",
  ProposalReadyForExecution: "text-amber-400",
  ProposalExecutedWithCooldown: "text-emerald-400",
  OrderExecuted: "text-emerald-400",
  AgentAuthorized: "text-blue-400",
  AgentRevoked: "text-red-400",
  Paused: "text-red-400",
  Unpaused: "text-emerald-400",
  ValidatorAdded: "text-blue-400",
  ValidatorRemoved: "text-red-400",
  ValidatorStatusChanged: "text-amber-400",
  ThresholdUpdated: "text-amber-400",
  ContractRefilled: "text-emerald-400",
  FeesSwapped: "text-purple-400",
  WalletAdded: "text-blue-400",
  WalletRemoved: "text-red-400",
};

function formatEventArgs(args: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(args)) {
    if (typeof value === "string" && value.startsWith("0x") && value.length === 42) {
      parts.push(`${key}: ${formatAddress(value)}`);
    } else if (typeof value === "bigint") {
      parts.push(`${key}: ${value.toString()}`);
    } else if (typeof value === "string") {
      parts.push(`${key}: ${value.length > 30 ? value.slice(0, 30) + "..." : value}`);
    } else if (typeof value === "number" || typeof value === "boolean") {
      parts.push(`${key}: ${String(value)}`);
    }
  }
  return parts.join(" · ");
}

function EventRow({ event }: { event: ContractEvent }) {
  const Icon = CONTRACT_ICONS[event.contractName] || ShieldCheck;
  const color = EVENT_COLORS[event.eventName] || "text-muted-foreground";

  const explorerUrl = `https://amoy.polygonscan.com/tx/${event.transactionHash}`;

  return (
    <div className="flex items-start gap-3 px-6 py-3 hover:bg-accent/30 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary mt-0.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${color}`}>
            {event.eventName}
          </span>
          <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-accent">
            {event.contractName}
          </span>
        </div>
        {Object.keys(event.args).length > 0 && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {formatEventArgs(event.args)}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-mono text-muted-foreground">
          #{event.blockNumber.toString()}
        </span>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

interface EventLogProps {
  maxEvents?: number;
  showHeader?: boolean;
}

export function EventLog({ maxEvents = 20, showHeader = true }: EventLogProps) {
  const { data: events, isLoading } = useRecentEvents();

  const displayEvents = events?.slice(0, maxEvents) ?? [];

  if (isLoading) {
    return showHeader ? <CardSkeleton /> : <div className="p-6"><CardSkeleton /></div>;
  }

  if (showHeader) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            On-chain events from treasury contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {displayEvents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No recent events found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayEvents.map((event) => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Inline mode (no card wrapper)
  return displayEvents.length === 0 ? (
    <div className="py-4 text-center text-sm text-muted-foreground">
      No recent events
    </div>
  ) : (
    <div className="divide-y divide-border">
      {displayEvents.map((event) => (
        <EventRow key={event.id} event={event} />
      ))}
    </div>
  );
}
