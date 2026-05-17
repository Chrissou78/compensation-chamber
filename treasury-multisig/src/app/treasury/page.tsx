// src/app/treasury/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import {useTreasuryBalance, useTreasuryPaused, useGasReserves, useAccumulatedFees,} from "@/hooks/useTreasury";
import { CardSkeleton } from "@/components/Skeleton";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {Shield, PauseCircle, PlayCircle, Fuel, Wallet, Timer, Coins,
  ShieldCheck, Users, Landmark, RefreshCw, TrendingUp, ChevronDown, ChevronRight,
  ArrowUpRight, Crown, DollarSign, AlertTriangle, FileSignature,} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  VariableTimelockController: Timer, GovernanceTokenV2: Coins, UpgradeGovernor: ShieldCheck,
  DynamicValidatorRegistry: Users, TreasuryController: Landmark, GasRefiller: Fuel,
  PayoutExecutor: Wallet, RebalancingExecutor: RefreshCw, StakingExecutor: TrendingUp,};

export default function TreasuryPage() {
  const { isConnected } = useAccount();
  const [expandedContract, setExpandedContract] = useState<string | null>(null);
  const { data: balance, isLoading: balanceLoading } = useTreasuryBalance();
  const { isPaused } = useTreasuryPaused();
  const { data: gasReserves, isLoading: gasLoading } = useGasReserves();
  const accumulatedFees = useAccumulatedFees();

  const contracts = [
    { name: "VariableTimelockController", address: CONTRACT_ADDRESSES.VARIABLE_TIMELOCK, description: "Severity-based timelock for scheduled operations", actions: ["Update Delays"] },
    { name: "GovernanceTokenV2", address: CONTRACT_ADDRESSES.GOVERNANCE_TOKEN, description: "1M TGV token with voting rights and blacklist", actions: ["Mint Tokens", "Blacklist Address"] },
    { name: "UpgradeGovernor", address: CONTRACT_ADDRESSES.UPGRADE_GOVERNOR, description: "Governance with immediate execution on threshold", actions: ["View Proposals", "Vote"] },
    { name: "DynamicValidatorRegistry", address: CONTRACT_ADDRESSES.VALIDATOR_REGISTRY, description: "Manages validator set and action thresholds", actions: ["Add Validator", "Remove Validator"] },
    { name: "TreasuryController", address: CONTRACT_ADDRESSES.TREASURY_CONTROLLER, description: "Core order execution with EIP-712 validation", actions: ["Pause", "Unpause", "Emergency Withdraw"] },
    { name: "GasRefiller", address: CONTRACT_ADDRESSES.GAS_REFILLER, description: "Multi-wallet management and automatic gas refill", actions: ["Emergency Refill", "View Gas Reserves"] },
    { name: "PayoutExecutor", address: "0x...", description: "Executes payouts with country-specific limits", actions: ["View Payouts", "Set Limits"] },
    { name: "RebalancingExecutor", address: "0x...", description: "Cross-country wallet rebalancing", actions: ["View Schedule", "Manual Rebalance"] },
    { name: "StakingExecutor", address: "0x...", description: "Staking position management with time locks", actions: ["View Positions", "Stake", "Unstake"] },
  ];

  const actionHrefMap: Record<string, string> = {
    "View Proposals": "/proposals", Vote: "/proposals", "Add Validator": "/actions/propose_add_validator",
    "Remove Validator": "/actions/propose_remove_validator", "Mint Tokens": "/actions/propose_mint_tokens",
    "Blacklist Address": "/actions/propose_blacklist_address", Pause: "/actions/execute_pause",
    Unpause: "/actions/execute_unpause", "Emergency Refill": "/actions/execute_emergency_refill",
    "Emergency Withdraw": "/actions/execute_withdraw", "Update Delays": "/actions/propose_update_delay",
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Connect your wallet to manage treasury contracts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treasury</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage treasury contracts, ownership, and emergency controls
        </p>
      </div>

      {/* Pause Banner */}
      {isPaused && (
        <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-400">
              Treasury Operations Paused
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              All order execution is currently halted. Unpause to resume operations.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/actions/execute_unpause">
              <PlayCircle className="h-3 w-3 mr-1" />
              Unpause
            </Link>
          </Button>
        </div>
      )}

      {/* Balance Overview */}
      {balanceLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription>Total Stablecoins</CardDescription>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(balance?.total ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription>USDC</CardDescription>
              <DollarSign className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(balance?.usdc ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription>USDT</CardDescription>
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(balance?.usdt ?? 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardDescription>Accumulated Fees</CardDescription>
              <Coins className="h-4 w-4 text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${formatNumber(accumulatedFees.usdc + accumulatedFees.usdt)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pending swap to MATIC
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gas Reserves */}
      {gasLoading ? (
        <CardSkeleton />
      ) : gasReserves && gasReserves.length > 0 ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gas Reserves</CardTitle>
              <CardDescription>MATIC balance per contract</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/actions/execute_emergency_refill">
                <Fuel className="h-3 w-3 mr-1" />
                Refill
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gasReserves.map((reserve) => {
                const percentage =
                  reserve.targetBalance > 0
                    ? (reserve.currentBalance / reserve.targetBalance) * 100
                    : 0;
                const status =
                  reserve.currentBalance >= reserve.refillThreshold
                    ? "healthy"
                    : reserve.currentBalance > 0
                      ? "warning"
                      : "critical";
                const barColor =
                  status === "healthy"
                    ? "bg-emerald-500"
                    : status === "warning"
                      ? "bg-amber-500"
                      : "bg-red-500";

                return (
                  <div key={reserve.contractAddress} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{reserve.contractName}</span>
                      <span className="text-muted-foreground">
                        {formatNumber(reserve.currentBalance, 3)} /{" "}
                        {formatNumber(reserve.targetBalance, 1)} MATIC
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{
                          width: `${Math.min(100, percentage)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Emergency Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Button
          variant="destructive"
          className="h-auto py-3 justify-start"
          asChild
        >
          <Link href="/actions/execute_pause">
            <PauseCircle className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="text-sm font-medium">Emergency Pause</div>
              <div className="text-[11px] opacity-70">Halt all operations</div>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 justify-start"
          asChild
        >
          <Link href="/actions/execute_emergency_refill">
            <Fuel className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="text-sm font-medium">Emergency Refill</div>
              <div className="text-[11px] text-muted-foreground">
                Top up gas reserves
              </div>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 justify-start"
          asChild
        >
          <Link href="/actions/execute_withdraw">
            <Wallet className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="text-sm font-medium">Emergency Withdraw</div>
              <div className="text-[11px] text-muted-foreground">
                Extract funds
              </div>
            </div>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-3 justify-start"
          asChild
        >
          <Link href="/treasury/orders">
            <FileSignature className="h-4 w-4 mr-2" />
            <div className="text-left">
              <div className="text-sm font-medium">Create Order</div>
              <div className="text-[11px] text-muted-foreground">
                EIP-712 signed order
              </div>
            </div>
          </Link>
        </Button>
      </div>

      {/* Contracts */}
      <Card>
        <CardHeader>
          <CardTitle>Smart Contracts ({contracts.length})</CardTitle>
          <CardDescription>Deployed treasury infrastructure</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {contracts.map((contract) => {
              const Icon = ICON_MAP[contract.name] || Shield;
              return (
                <div key={contract.name}>
                  <button
                    onClick={() =>
                      setExpandedContract(
                        expandedContract === contract.name
                          ? null
                          : contract.name
                      )
                    }
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{contract.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {contract.description}
                        </p>
                      </div>
                    </div>
                    {expandedContract === contract.name ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    )}
                  </button>

                  {expandedContract === contract.name && (
                    <div className="px-6 py-4 bg-accent/30 border-t border-border space-y-4">
                      {contract.address !== "0x..." &&
                        contract.address !== "0x" && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Contract Address
                            </p>
                            <p className="font-mono text-xs break-all p-2 rounded bg-secondary">
                              {contract.address}
                            </p>
                          </div>
                        )}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">
                          Available Actions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {contract.actions.map((action) => (
                            <Button
                              key={action}
                              variant="secondary"
                              size="sm"
                              asChild
                            >
                              <Link
                                href={actionHrefMap[action] || "/"}
                              >
                                {action}
                                <ArrowUpRight className="h-3 w-3 ml-1" />
                              </Link>
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ownership Transfer */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm font-medium">Transfer All Ownership</p>
            <p className="text-xs text-muted-foreground mt-1">
              Initiate governance proposal to transfer contracts to a new
              multisig
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/actions/propose_ownership_transfer">
              <Crown className="h-4 w-4 mr-2" />
              Transfer
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
