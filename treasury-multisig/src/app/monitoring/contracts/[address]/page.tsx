// src/app/monitoring/contracts/[address]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useContractDetail } from "@/hooks/useMonitoring";
import { formatNumber, formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, CheckCircle, XCircle } from "lucide-react";

export default function ContractDetailPage() {
  const { address } = useParams<{ address: string }>();
  const { data, isLoading } = useContractDetail(address);

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/monitoring"><ArrowLeft className="h-3 w-3 mr-1" /> Monitoring</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contract Details</h1>
        <p className="text-sm text-muted-foreground font-mono mt-1">{address}</p>
      </div>

      {isLoading ? <CardSkeleton /> : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2"><CardDescription>Deployed</CardDescription></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {data?.isDeployed ? <CheckCircle className="h-5 w-5 text-emerald-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
                  <span className="text-lg font-bold">{data?.isDeployed ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Balance</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data?.balance ?? 0)} MATIC</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardDescription>Recent Events</CardDescription></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.events.length ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Last {data?.events.length ?? 0} log entries</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {!data?.events.length ? (
                <p className="text-sm text-muted-foreground py-12 text-center">No events found</p>
              ) : (
                <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
                  {data.events.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-6 py-3 hover:bg-accent/30">
                      <div>
                        <p className="text-xs text-muted-foreground">Block #{e.blockNumber}</p>
                        <p className="text-[11px] font-mono text-muted-foreground truncate max-w-xs">{e.data.slice(0, 50)}...</p>
                      </div>
                      <a href={`https://amoy.polygonscan.com/tx/${e.transactionHash}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground shrink-0">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <a href={`https://amoy.polygonscan.com/address/${address}`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline">View on Polygonscan <ExternalLink className="h-3.5 w-3.5 ml-2" /></Button>
          </a>
        </>
      )}
    </div>
  );
}
