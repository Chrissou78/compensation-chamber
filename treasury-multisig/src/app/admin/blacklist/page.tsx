// src/app/admin/blacklist/page.tsx
"use client";

import Link from "next/link";
import { useBlacklist } from "@/hooks/useAdmin";
import { formatAddress } from "@/lib/utils";
import { CardSkeleton } from "@/components/Skeleton";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Ban, Plus, Shield } from "lucide-react";

export default function AdminBlacklistPage() {
  const { data: blacklist, isLoading } = useBlacklist();

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
        <Button asChild>
          <Link href="/actions/propose_blacklist_address">
            <Plus className="h-4 w-4 mr-2" /> Blacklist Address
          </Link>
        </Button>
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
              {blacklist.map((entry) => (
                <div key={entry.address} className="flex items-center justify-between px-6 py-4 hover:bg-accent/30">
                  <div className="flex items-center gap-3">
                    <Ban className="h-4 w-4 text-red-400" />
                    <span className="font-mono text-sm">{entry.address}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs" asChild>
                    <a
                      href={`https://amoy.polygonscan.com/address/${entry.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View on Explorer
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
