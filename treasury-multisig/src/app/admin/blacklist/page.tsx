// src/app/admin/blacklist/page.tsx
"use client";

import Link from "next/link";
import { useBlacklist } from "@/hooks/useAdmin";
import { formatAddress } from "@/lib/utils";
import { useAppStore } from "@/store";
import { ExportButton } from "@/components/ExportButton";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Plus, Shield, Copy, Check } from "lucide-react";
import { useState } from "react";

export default function AdminBlacklistPage() {
  const { data: blacklist, isLoading } = useBlacklist();
  const resolveLabel = useAppStore((s) => s.resolveAddressLabel);
  const addToast = useAppStore((s) => s.addToast);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    addToast({ type: "success", title: "Address copied", duration: 1500 });
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-8">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/admin"><ArrowLeft className="h-3 w-3 mr-1" /> Admin</Link>
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Blacklist Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {blacklist?.length ?? 0} addresses currently blacklisted
          </p>
        </div>
        <div className="flex items-center gap-2">
          {blacklist && blacklist.length > 0 && (
            <ExportButton
              data={blacklist.map((e) => ({ address: e.address, label: resolveLabel(e.address) || "" }))}
              filename="blacklist"
              label="Export"
            />
          )}
          <Button asChild>
            <Link href="/actions/propose_blacklist_address">
              <Plus className="h-4 w-4 mr-2" /> Blacklist Address
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : !blacklist || blacklist.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No blacklisted addresses</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {blacklist.map((entry) => {
                const label = resolveLabel(entry.address);
                return (
                  <div key={entry.address} className="flex items-center justify-between px-6 py-4 hover:bg-accent/30">
                    <div className="flex items-center gap-3">
                      <Ban className="h-4 w-4 text-red-400 shrink-0" />
                      <div>
                        {label && <p className="text-sm font-medium">{label}</p>}
                        <p className="font-mono text-xs text-muted-foreground">{entry.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(entry.address)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {copied === entry.address ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <Button variant="ghost" size="sm" className="text-xs" asChild>
                        <a
                          href={`https://amoy.polygonscan.com/address/${entry.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Explorer
                        </a>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
