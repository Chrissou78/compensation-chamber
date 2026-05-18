// src/app/admin/validators/page.tsx
"use client";

import Link from "next/link";
import { useValidators, useValidatorCount } from "@/hooks/useValidators";
import { useValidatorLimits } from "@/hooks/useGovernance";
import { formatAddress, formatNumber } from "@/lib/utils";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/Skeleton";
import { ArrowLeft, Users, Plus, Shield, Ban, CheckCircle, XCircle } from "lucide-react";

export default function AdminValidatorsPage() {
  const { data: validators, isLoading } = useValidators();
  const { total, active, blacklisted } = useValidatorCount();
  const { minValidators, maxValidators } = useValidatorLimits();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin"><ArrowLeft className="h-3 w-3 mr-1" /> Admin</Link>
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Validators Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {active} active · {blacklisted} blacklisted · {minValidators}-{maxValidators} range
          </p>
        </div>
        <Button asChild>
          <Link href="/actions/propose_add_validator">
            <Plus className="h-4 w-4 mr-2" /> Add Validator
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <CardSkeleton />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Name</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Address</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Voting Power</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {validators?.map((v) => (
                    <tr key={v.address} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-6 py-4 font-medium">{v.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{formatAddress(v.address)}</td>
                      <td className="px-6 py-4">{formatNumber(v.votingPower, 0)} TGV</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                          v.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : "bg-red-500/10 text-red-400 ring-red-500/20"
                        }`}>
                          {v.status === "ACTIVE" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {v.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {v.status === "ACTIVE" && (
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" asChild>
                            <Link href="/actions/propose_remove_validator">Remove</Link>
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
      )}
    </div>
  );
}
