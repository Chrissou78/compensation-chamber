// src/app/treasury/fund/page.tsx
"use client";

import { useState } from "react";
import { useAccount, useBalance, useChainId } from "wagmi";
import { type Address, formatUnits } from "viem";
import { CONTRACT_ADDRESSES, TOKEN_ADDRESSES } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";
import {
  useFundGasRefiller,
  useGasRefillerBalance,
  useRegisterContract,
  useRefillFromGasRefiller,
  useRefillAll,
  useMintTestTokens,
  useTransferToTreasury,
} from "@/hooks/useFunding";
import { useGasReserves } from "@/hooks/useTreasury";
import { useTokenBalance } from "@/hooks/useTreasury";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Fuel,
  ArrowDown,
  ArrowRight,
  Shield,
  Coins,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";

// Contracts to register / manage
const MANAGED_CONTRACTS: {
  name: string;
  key: keyof typeof CONTRACT_ADDRESSES;
  defaultTarget: string;
  defaultThreshold: string;
}[] = [
  { name: "TreasuryController", key: "TREASURY_CONTROLLER", defaultTarget: "4", defaultThreshold: "1" },
  { name: "UpgradeGovernor", key: "UPGRADE_GOVERNOR", defaultTarget: "4", defaultThreshold: "1" },
  { name: "ValidatorRegistry", key: "VALIDATOR_REGISTRY", defaultTarget: "4", defaultThreshold: "1" },
  { name: "GovernanceToken", key: "GOVERNANCE_TOKEN", defaultTarget: "2", defaultThreshold: "0.5" },
  { name: "PayoutExecutor", key: "PAYOUT_EXECUTOR", defaultTarget: "4", defaultThreshold: "1" },
  { name: "RebalancingExecutor", key: "REBALANCING_EXECUTOR", defaultTarget: "4", defaultThreshold: "1" },
  { name: "StakingExecutor", key: "STAKING_EXECUTOR", defaultTarget: "4", defaultThreshold: "1" },
  { name: "VariableTimelock", key: "VARIABLE_TIMELOCK", defaultTarget: "2", defaultThreshold: "0.5" },
];

export default function FundPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isTestnet = chainId === 80002; // Amoy

  // ─── POL Funding State ────────────────────────────────────
  const [polAmount, setPolAmount] = useState("10");
  const { fundGasRefiller, isPending: fundPending } = useFundGasRefiller();
  const { data: gasRefillerBal } = useGasRefillerBalance();
  const { data: ownerBalance } = useBalance({ address });

  // ─── Registration State ───────────────────────────────────
  const { registerContract, isPending: regPending } = useRegisterContract();
  const [regTarget, setRegTarget] = useState("4");
  const [regThreshold, setRegThreshold] = useState("1");

  // ─── Refill State ─────────────────────────────────────────
  const { refillContract, isPending: refillPending } = useRefillFromGasRefiller();
  const { refillAll, isPending: refillAllPending } = useRefillAll();
  const { data: gasReserves } = useGasReserves();

  // ─── Token Funding State ──────────────────────────────────
  const [mintToken, setMintToken] = useState<"USDC" | "USDT">("USDC");
  const [mintAmount, setMintAmount] = useState("10000");
  const { mintTokens, isPending: mintPending } = useMintTestTokens();

  const [transferToken, setTransferToken] = useState<"USDC" | "USDT">("USDC");
  const [transferAmount, setTransferAmount] = useState("5000");
  const { transferTokens, isPending: transferPending } = useTransferToTreasury();

  const { data: walletUsdc } = useTokenBalance("USDC", address);
  const { data: walletUsdt } = useTokenBalance("USDT", address);

  if (!isConnected) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center">
        <Shield className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">
          Connect your wallet to fund treasury contracts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fund Treasury</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deposit POL into GasRefiller, register contracts, and distribute gas.
          {isTestnet && " You can also mint test USDC/USDT on Amoy."}
        </p>
      </div>

      {/* ─── STEP 1: Deposit POL into GasRefiller ──────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              1
            </span>
            Deposit POL into GasRefiller
          </CardTitle>
          <CardDescription>
            GasRefiller is the single entry point. Send POL here, then distribute to all contracts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Your POL Balance</p>
              <p className="text-lg font-bold mt-1">
                {ownerBalance ? formatNumber(Number(formatUnits(ownerBalance.value, 18)), 4) : "—"} POL
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">GasRefiller Balance</p>
              <p className="text-lg font-bold mt-1">
                {gasRefillerBal !== undefined ? formatNumber(gasRefillerBal, 4) : "—"} POL
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">GasRefiller Address</p>
              <p className="text-xs font-mono mt-2 break-all">
                {CONTRACT_ADDRESSES.GAS_REFILLER}
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1.5 block">Amount (POL)</label>
              <input
                type="number"
                value={polAmount}
                onChange={(e) => setPolAmount(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="10"
                min="0.1"
                step="0.1"
              />
            </div>
            <Button
              onClick={() => fundGasRefiller(polAmount)}
              disabled={fundPending || !polAmount || Number(polAmount) <= 0}
              className="min-w-[140px]"
            >
              {fundPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ArrowDown className="h-4 w-4 mr-2" />
              )}
              Deposit POL
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ─── STEP 2: Register Contracts ────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              2
            </span>
            Register Contracts for Gas Reserves
          </CardTitle>
          <CardDescription>
            Each contract needs a target balance and refill threshold. Register them once, then refill as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MANAGED_CONTRACTS.map((contract) => {
              const addr = CONTRACT_ADDRESSES[contract.key] as Address;
              const reserve = gasReserves?.find(
                (r) => r.contractAddress.toLowerCase() === addr.toLowerCase()
              );

              return (
                <div
                  key={contract.key}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Fuel className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{contract.name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground truncate">
                        {addr}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {reserve && reserve.currentBalance > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircle className="h-3 w-3" />
                        {formatNumber(reserve.currentBalance, 3)} POL
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not funded</span>
                    )}
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        registerContract(addr, contract.defaultTarget, contract.defaultThreshold)
                      }
                      disabled={regPending}
                    >
                      {regPending ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        "Register"
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── STEP 3: Distribute Gas ────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                3
              </span>
              Distribute Gas to Contracts
            </CardTitle>
            <CardDescription>
              Send POL from GasRefiller to registered contracts. Refill those below threshold.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refillAll()}
            disabled={refillAllPending}
          >
            {refillAllPending ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Refill All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gasReserves && gasReserves.length > 0 ? (
              gasReserves.map((reserve) => {
                const percentage =
                  reserve.targetBalance > 0
                    ? (reserve.currentBalance / reserve.targetBalance) * 100
                    : 0;
                const needsRefill = reserve.currentBalance < reserve.refillThreshold;
                const barColor = needsRefill
                  ? reserve.currentBalance > 0
                    ? "bg-amber-500"
                    : "bg-red-500"
                  : "bg-emerald-500";

                return (
                  <div
                    key={reserve.contractAddress}
                    className="flex items-center gap-4 rounded-lg border border-border p-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{reserve.contractName}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatNumber(reserve.currentBalance, 3)} / {formatNumber(reserve.targetBalance, 1)} POL
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                    </div>
                    {needsRefill && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          const deficit = reserve.targetBalance - reserve.currentBalance;
                          refillContract(
                            reserve.contractAddress as Address,
                            deficit.toFixed(4)
                          );
                        }}
                        disabled={refillPending}
                      >
                        {refillPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <>
                            <ArrowRight className="h-3 w-3 mr-1" />
                            Refill
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <AlertTriangle className="h-5 w-5 mx-auto mb-2 text-amber-400" />
                No gas reserves data. Register contracts first.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── STEP 4: Fund Stablecoins ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              4
            </span>
            Fund Treasury with Stablecoins
          </CardTitle>
          <CardDescription>
            {isTestnet
              ? "Mint test USDC/USDT, then transfer to the TreasuryController."
              : "Transfer USDC/USDT from your wallet to the TreasuryController."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Wallet balances */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Your USDC</p>
              <p className="text-lg font-bold mt-1">
                {walletUsdc ? formatNumber(walletUsdc.balance) : "0"} USDC
              </p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <p className="text-xs text-muted-foreground">Your USDT</p>
              <p className="text-lg font-bold mt-1">
                {walletUsdt ? formatNumber(walletUsdt.balance) : "0"} USDT
              </p>
            </div>
          </div>

          {/* Mint section (testnet only) */}
          {isTestnet && (
            <div className="rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
              <p className="text-sm font-medium text-amber-400 flex items-center gap-2">
                <Coins className="h-4 w-4" />
                Testnet: Mint Test Tokens
              </p>
              <div className="flex items-end gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Token</label>
                  <select
                    value={mintToken}
                    onChange={(e) => setMintToken(e.target.value as "USDC" | "USDT")}
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                  <input
                    type="number"
                    value={mintAmount}
                    onChange={(e) => setMintAmount(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="10000"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => mintTokens(mintToken, address!, mintAmount)}
                  disabled={mintPending}
                >
                  {mintPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Coins className="h-4 w-4 mr-2" />
                  )}
                  Mint
                </Button>
              </div>
            </div>
          )}

          {/* Transfer to Treasury */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Transfer to TreasuryController</p>
            <p className="text-xs text-muted-foreground font-mono">
              {CONTRACT_ADDRESSES.TREASURY_CONTROLLER}
            </p>
            <div className="flex items-end gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Token</label>
                <select
                  value={transferToken}
                  onChange={(e) => setTransferToken(e.target.value as "USDC" | "USDT")}
                  className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-1 block">Amount</label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="5000"
                />
              </div>
              <Button
                onClick={() => transferTokens(transferToken, transferAmount)}
                disabled={transferPending || !transferAmount || Number(transferAmount) <= 0}
              >
                {transferPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 mr-2" />
                )}
                Transfer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
