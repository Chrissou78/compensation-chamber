"use client";

import { useState } from "react";
import Link from "next/link";
import { useValidators, useValidatorCount } from "@/hooks/useValidators";
import { formatAddress, formatNumber } from "@/lib/utils";
import { REQUIRED_THRESHOLD, TOTAL_VALIDATORS } from "@/lib/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  ShieldCheck,
  Scale,
  Timer,
  UserPlus,
  UserMinus,
  ChevronDown,
  ChevronRight,
  Settings,
} from "lucide-react";

export default function GovernancePage() {
  const { data: validators, isLoading } = useValidators();
  const { total, active, blacklisted } = useValidatorCount();
  const [expandedValidator, setExpandedValidator] = useState<string | null>(
    null
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Governance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage validators, thresholds, and governance settings
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Total Validators</CardDescription>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {active} active, {blacklisted} blacklisted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Signature Threshold</CardDescription>
            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {REQUIRED_THRESHOLD}/{TOTAL_VALIDATORS}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Required for actions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Voting Power</CardDescription>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Equal</div>
            <p className="text-xs text-muted-foreground mt-1">
              200K TGV per validator
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription>Voting Period</CardDescription>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Immediate</div>
            <p className="text-xs text-muted-foreground mt-1">
              On 3-of-5 threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button variant="outline" className="h-auto py-3 justify-start" asChild>
          <Link href="/actions/propose_add_validator">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Validator
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-3 justify-start text-destructive hover:text-destructive" asChild>
          <Link href="/actions/propose_remove_validator">
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Validator
          </Link>
        </Button>
      </div>

      {/* Validators Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Validators ({active}/{total})
          </CardTitle>
          <CardDescription>Active members of the multisig</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Loading validators...
            </div>
          ) : !validators || validators.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No validators found
            </div>
          ) : (
            <div className="divide-y divide-border">
              {validators.map((validator, index) => (
                <div key={validator.address}>
                  <button
                    onClick={() =>
                      setExpandedValidator(
                        expandedValidator === validator.address
                          ? null
                          : validator.address
                      )
                    }
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{validator.name}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {formatAddress(validator.address)}
                        </p>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatNumber(validator.votingPower / 1000)}K TGV
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset ${
                          validator.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                            : "bg-red-500/10 text-red-400 ring-red-500/20"
                        }`}
                      >
                        {validator.status}
                      </span>
                      {expandedValidator === validator.address ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {expandedValidator === validator.address && (
                    <div className="px-6 py-4 bg-accent/30 border-t border-border">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Wallet Address
                          </p>
                          <p className="font-mono text-xs break-all">
                            {validator.address}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">
                            Voting Power
                          </p>
                          <p className="font-bold">
                            {formatNumber(validator.votingPower / 1000)}K TGV
                          </p>
                        </div>
                        {validator.joinedAt && (
                          <div>
                            <p className="text-muted-foreground mb-1">Joined</p>
                            <p>
                              {new Date(
                                validator.joinedAt * 1000
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      {validator.status === "ACTIVE" && (
                        <div className="mt-4">
                          <Button variant="destructive" size="sm" asChild>
                            <Link
                              href={`/actions/propose_remove_validator?address=${validator.address}`}
                            >
                              <UserMinus className="h-3 w-3 mr-1" />
                              Remove
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Threshold Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Signature Threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Required Signatures</span>
              <span className="font-bold">
                {REQUIRED_THRESHOLD} of {TOTAL_VALIDATORS}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Validators</span>
              <span className="font-bold">{active}</span>
            </div>
            <div className="pt-3 border-t border-border text-muted-foreground space-y-1">
              <p>Applies to: governance proposals, emergency actions, ownership transfers, contract upgrades</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Action Thresholds</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/actions/propose_threshold_change">
                <Settings className="h-3 w-3 mr-1" />
                Change
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { name: "Payouts", threshold: 3 },
              { name: "Rebalancing", threshold: 3 },
              { name: "Staking", threshold: 3 },
              { name: "Upgrades", threshold: 5 },
              { name: "Minting", threshold: 3 },
            ].map((action) => (
              <div
                key={action.name}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
              >
                <span className="text-sm">{action.name}</span>
                <span className="text-sm font-bold">
                  {action.threshold}/{TOTAL_VALIDATORS}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
