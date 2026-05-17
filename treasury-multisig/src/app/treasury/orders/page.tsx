// src/app/treasury/orders/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { type Address } from "viem";
import { useOrderFlow } from "@/hooks/useOrderSigning";
import { useTokenInfo } from "@/hooks/useTreasury";
import { OrderType } from "@/lib/eip712";
import { TOKEN_ADDRESSES } from "@/lib/constants";
import { formatAddress } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  PenLine,
  Zap,
  AlertTriangle,
  FileSignature,
  Plus,
} from "lucide-react";

interface OrderFormData {
  orderType: string;
  token: string;
  amount: string;
  recipient: string;
  fromWallet: string;
}

export default function OrdersPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<OrderFormData>({ mode: "onBlur" });

  const {
    createAndSign,
    addSignature,
    execute,
    reset,
    currentOrder,
    signatures,
    signerAddress,
    isPending,
    isSuccess,
    hash,
    requiredSignatures,
  } = useOrderFlow();

  const selectedToken = watch("token") as "USDC" | "USDT" | undefined;
  const tokenInfo = useTokenInfo(selectedToken || "USDC");

  const [step, setStep] = useState<"create" | "collect" | "execute" | "done">("create");

  const onCreateAndSign = async (data: OrderFormData) => {
    const orderType =
      data.orderType === "REBALANCE"
        ? OrderType.REBALANCE
        : data.orderType === "STAKING"
          ? OrderType.STAKING
          : OrderType.PAYOUT;

    const result = await createAndSign(
      orderType,
      data.token as "USDC" | "USDT",
      data.amount,
      tokenInfo.decimals,
      data.recipient as Address,
      BigInt(0) // nonce — in production, fetch from contract
    );

    if (result.signature) {
      setStep("collect");
    }
  };

  const onAddSignature = async () => {
    if (!currentOrder) return;
    await addSignature(currentOrder);
  };

  const onExecute = (fromWallet: string) => {
    execute(fromWallet as Address);
    setStep("done");
  };

  if (isSuccess && step === "done") {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/treasury">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Treasury
          </Link>
        </Button>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold">Order Executed</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The treasury order has been executed successfully
            </p>
            {hash && (
              <p className="text-xs font-mono text-muted-foreground mt-2 break-all">
                TX: {hash}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { reset(); setStep("create"); }}
          >
            Create Another Order
          </Button>
        </div>
      </div>
    );
  }

  const baseClasses =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/treasury">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Treasury
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Treasury Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Create, sign, and execute EIP-712 treasury orders
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2">
        {["create", "collect", "execute"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : signatures.length > i || step === "done"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-xs font-medium capitalize ${
                step === s ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s}
            </span>
            {i < 2 && (
              <div className="w-8 h-px bg-border" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Create Order */}
      {step === "create" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PenLine className="h-4 w-4" />
              Create Order
            </CardTitle>
            <CardDescription>
              Define the order parameters and sign first
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreateAndSign)} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Order Type</label>
                <select
                  {...register("orderType", { required: "Order type is required" })}
                  className={baseClasses}
                >
                  <option value="">Select type</option>
                  <option value="PAYOUT">Payout</option>
                  <option value="REBALANCE">Rebalance</option>
                  <option value="STAKING">Staking</option>
                </select>
                {errors.orderType && (
                  <p className="text-xs text-destructive">{errors.orderType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Token</label>
                <select
                  {...register("token", { required: "Token is required" })}
                  className={baseClasses}
                >
                  <option value="">Select token</option>
                  <option value="USDC">USDC ({formatAddress(TOKEN_ADDRESSES.USDC)})</option>
                  <option value="USDT">USDT ({formatAddress(TOKEN_ADDRESSES.USDT)})</option>
                </select>
                {errors.token && (
                  <p className="text-xs text-destructive">{errors.token.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Amount</label>
                <input
                  type="number"
                  step="any"
                  {...register("amount", {
                    required: "Amount is required",
                    min: { value: 0.01, message: "Minimum 0.01" },
                  })}
                  placeholder="e.g. 1000"
                  className={baseClasses}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Recipient Address</label>
                <input
                  type="text"
                  {...register("recipient", {
                    required: "Recipient is required",
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message: "Invalid Ethereum address",
                    },
                  })}
                  placeholder="0x..."
                  className={baseClasses}
                />
                {errors.recipient && (
                  <p className="text-xs text-destructive">{errors.recipient.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">From Wallet (Treasury)</label>
                <input
                  type="text"
                  {...register("fromWallet", {
                    required: "From wallet is required",
                    pattern: {
                      value: /^0x[a-fA-F0-9]{40}$/,
                      message: "Invalid Ethereum address",
                    },
                  })}
                  placeholder="0x..."
                  defaultValue={CONTRACT_ADDRESSES.TREASURY_CONTROLLER !== "0x" ? CONTRACT_ADDRESSES.TREASURY_CONTROLLER : ""}
                  className={baseClasses}
                />
                {errors.fromWallet && (
                  <p className="text-xs text-destructive">{errors.fromWallet.message}</p>
                )}
              </div>

              <Button type="submit" disabled={isPending} className="w-full" size="lg">
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <FileSignature className="mr-2 h-4 w-4" />
                    Create & Sign Order
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Collect Signatures */}
      {step === "collect" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Collect Signatures ({signatures.length}/{requiredSignatures})
            </CardTitle>
            <CardDescription>
              {requiredSignatures - signatures.length} more signature(s) needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Signature list */}
            <div className="space-y-2">
              {signatures.map((sig, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">Signature #{i + 1}</p>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">
                      {sig}
                    </p>
                  </div>
                </div>
              ))}

              {Array.from({ length: requiredSignatures - signatures.length }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border"
                >
                  <div className="h-4 w-4 rounded-full border-2 border-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground">Awaiting signature...</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onAddSignature}
                disabled={isPending || signatures.length >= requiredSignatures}
                className="flex-1"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Signature
                  </>
                )}
              </Button>

              {signatures.length >= requiredSignatures && (
                <Button
                  variant="default"
                  onClick={() => setStep("execute")}
                  className="flex-1"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Proceed to Execute
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Each validator must connect their wallet and sign. In production,
              signatures can be collected off-chain and submitted together.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Execute */}
      {step === "execute" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Execute Order
            </CardTitle>
            <CardDescription>
              All {requiredSignatures} signatures collected — ready to execute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentOrder && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {currentOrder.orderType === OrderType.PAYOUT
                      ? "Payout"
                      : currentOrder.orderType === OrderType.REBALANCE
                        ? "Rebalance"
                        : "Staking"}
                  </span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-muted-foreground">Token</span>
                  <span className="font-mono text-xs">{formatAddress(currentOrder.token)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-mono text-xs">{formatAddress(currentOrder.recipient)}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-accent/50">
                  <span className="text-muted-foreground">Signatures</span>
                  <span className="font-bold text-emerald-400">{signatures.length}/{requiredSignatures}</span>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-400">Irreversible</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will transfer funds from the treasury. A 0.1% fee applies. Ensure
                  all parameters are correct.
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={isPending}
              onClick={() => {
                const fromWallet = watch("fromWallet") || CONTRACT_ADDRESSES.TREASURY_CONTROLLER;
                onExecute(fromWallet);
              }}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Execute Order On-Chain
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
