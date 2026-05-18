// src/app/monitoring/events/page.tsx
"use client";

import Link from "next/link";
import { EventLog } from "@/components/EventLog";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function MonitoringEventsPage() {
  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/monitoring"><ArrowLeft className="h-3 w-3 mr-1" /> Monitoring</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Event Log</h1>
        <p className="text-sm text-muted-foreground mt-1">All decoded contract events across the treasury system</p>
      </div>

      <EventLog maxEvents={100} showHeader={false} />
    </div>
  );
}
