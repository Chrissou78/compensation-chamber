// src/app/proposals/create/page.tsx
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { type Address, encodeFunctionData, parseAbiItem, toFunctionSelector } from "viem";
import { usePropose } from "@/hooks/useVoting";
import { CONTRACT_ADDRESSES, SEVERITY_DELAYS } from "@/lib/constants";
import { useAppStore } from "@/store";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertTriangle, Clock,
  Shield, FileText, Zap,
} from "lucide-react";

type Severity = "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE";
type Step = "details" | "target" | "calldata" | "review";

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "details", label: "Details", icon: FileText },
  { id: "target", label: "Target", icon: Shield },
  { id: "calldata", label: "Calldata", icon: Zap },
  { id: "review", label: "Review", icon: Check },
];

function formatDelay(seconds: number, fallback: string): string {
  if (!seconds) return fallback;
  const hours = seconds / 3600;
  return hours >= 24 ? `${hours / 24} days` : `${hours} hours`;
}

const SEVERITY_OPTIONS: { value: Severity; label: string; delay: string; color: string }[] = [
  { value: "EMERGENCY", label: "Emergency", delay: formatDelay(SEVERITY_DELAYS.EMERGENCY, "1 hour"), color: "text-red-400 bg-red-500/10 ring-red-500/20" },
  { value: "CRITICAL", label: "Critical", delay: formatDelay(SEVERITY_DELAYS.CRITICAL, "6 hours"), color: "text-amber-400 bg-amber-500/10 ring-amber-500/20" },
  { value: "IMPORTANT", label: "Important", delay: formatDelay(SEVERITY_DELAYS.IMPORTANT, "24 hours"), color: "text-blue-400 bg-blue-500/10 ring-blue-500/20" },
  { value: "ROUTINE", label: "Routine", delay: formatDelay(SEVERITY_DELAYS.ROUTINE, "48 hours"), color: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20" },
];

const TARGET_PRESETS = Object.entries(CONTRACT_ADDRESSES).map(([key, addr]) => ({
  label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  value: addr,
}));

const baseInput =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";

export default function CreateProposalPage() {
  const { isConnected } = useAccount();
  const { propose, isPending } = usePropose();
  const addToast = useAppStore((s) => s.addToast);

  const [step, setStep] = useState<Step>("details");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("ROUTINE");
  const [targetAddress, setTargetAddress] = useState("");
  const [value, setValue] = useState("0");
  const [calldata, setCalldata] = useState("0x");
  const [calldataMode, setCalldataMode] = useState<"raw" | "builder">("raw");

  // Builder fields
  const [fnSignature, setFnSignature] = useState("");
  const [fnArgs, setFnArgs] = useState("");

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  const canProceed = useMemo(() => {
    switch (step) {
      case "details": return title.trim().length > 0 && description.trim().length > 0;
      case "target": return /^0x[a-fA-F0-9]{40}$/.test(targetAddress);
      case "calldata": return calldata.startsWith("0x");
      case "review": return true;
      default: return false;
    }
  }, [step, title, description, targetAddress, calldata]);

  const buildCalldata = () => {
    if (!fnSignature.trim()) return;
    try {
      // Parse the full signature string, e.g. "transfer(address,uint256)"
      const sig = fnSignature.trim();
      // Build the 4-byte selector manually and encode args via low-level approach
      // Use viem's ABI encoding with a manually constructed ABI item
      const abiItem = parseAbiItem(`function ${sig}`);
      const fnName = sig.slice(0, sig.indexOf("("));

      // Parse user-provided arguments
      const args: unknown[] = fnArgs.trim() ? JSON.parse(`[${fnArgs}]`) : [];

      // Encode using viem — cast through unknown to satisfy strict generics
      const encoded = encodeFunctionData({
        abi: [abiItem],
        functionName: fnName,
        args,
      } as unknown as Parameters<typeof encodeFunctionData>[0]);

      setCalldata(encoded);
      addToast({ type: "success", title: "Calldata built", message: `${encoded.slice(0, 20)}...` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to encode calldata";
      addToast({ type: "error", title: "Build failed", message: msg });
    }
  };

  const severityValue = (s: Severity): number => {
    switch (s) {
      case "EMERGENCY": return 0;
      case "CRITICAL": return 1;
      case "IMPORTANT": return 2;
      default: return 3;
    }
  };

  const handleSubmit = async () => {
    try {
      await propose(
        [targetAddress as Address],
        [BigInt(value || "0")],
        [calldata as `0x${string}`],
        `${title}\n\n${description}`,
        severityValue(severity)
      );
      addToast({ type: "success", title: "Proposal submitted", message: "It will now go through governance voting." });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      addToast({ type: "error", title: "Submission failed", message: msg });
    }
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Connect your wallet to create proposals</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/proposals"><ArrowLeft className="h-3 w-3 mr-1" /> Proposals</Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Proposal</h1>
        <p className="text-sm text-muted-foreground mt-1">Submit a new governance proposal for validator voting</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = i < stepIdx;
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && <div className={`h-px w-6 ${isDone ? "bg-primary" : "bg-border"}`} />}
              <button
                onClick={() => isDone && setStep(s.id)}
                disabled={!isDone && !isActive}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary ring-primary/30"
                    : isDone
                      ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20 cursor-pointer"
                      : "bg-secondary text-muted-foreground ring-border"
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {step === "details" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Title <span className="text-destructive">*</span></label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" className={baseInput} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description <span className="text-destructive">*</span></label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what this proposal does and why..." rows={5} className={`${baseInput} resize-none`} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Severity</label>
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSeverity(opt.value)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm ring-1 ring-inset transition-colors ${
                        severity === opt.value ? opt.color : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <div className="text-left">
                        <div className="font-medium text-xs">{opt.label}</div>
                        <div className="text-[10px] opacity-70">{opt.delay} cooldown</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === "target" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Contract Address <span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={targetAddress}
                  onChange={(e) => setTargetAddress(e.target.value)}
                  placeholder="0x..."
                  className={`${baseInput} font-mono`}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Quick Select</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TARGET_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setTargetAddress(p.value)}
                      className={`text-left rounded-md px-3 py-2 text-xs ring-1 ring-inset transition-colors ${
                        targetAddress === p.value
                          ? "bg-primary/10 text-primary ring-primary/30"
                          : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                      }`}
                    >
                      <div className="font-medium">{p.label}</div>
                      <div className="font-mono text-[10px] opacity-60 truncate">{p.value}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ETH/MATIC Value (wei)</label>
                <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder="0" className={`${baseInput} font-mono`} />
              </div>
            </>
          )}

          {step === "calldata" && (
            <>
              <div className="flex gap-2">
                <button
                  onClick={() => setCalldataMode("raw")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md ring-1 ring-inset transition-colors ${
                    calldataMode === "raw" ? "bg-primary/10 text-primary ring-primary/30" : "bg-secondary text-muted-foreground ring-border"
                  }`}
                >Raw Hex</button>
                <button
                  onClick={() => setCalldataMode("builder")}
                  className={`text-xs font-medium px-3 py-1.5 rounded-md ring-1 ring-inset transition-colors ${
                    calldataMode === "builder" ? "bg-primary/10 text-primary ring-primary/30" : "bg-secondary text-muted-foreground ring-border"
                  }`}
                >ABI Builder</button>
              </div>

              {calldataMode === "raw" ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Calldata (hex)</label>
                  <textarea
                    value={calldata}
                    onChange={(e) => setCalldata(e.target.value)}
                    rows={4}
                    className={`${baseInput} font-mono text-xs resize-none`}
                    placeholder="0x..."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Function Signature</label>
                    <input
                      type="text"
                      value={fnSignature}
                      onChange={(e) => setFnSignature(e.target.value)}
                      placeholder="transfer(address to, uint256 amount)"
                      className={`${baseInput} font-mono text-xs`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Arguments (comma-separated)</label>
                    <input
                      type="text"
                      value={fnArgs}
                      onChange={(e) => setFnArgs(e.target.value)}
                      placeholder={'"0xabc...", 1000000'}
                      className={`${baseInput} font-mono text-xs`}
                    />
                  </div>
                  <Button size="sm" variant="outline" onClick={buildCalldata}>Build Calldata</Button>
                  {calldata !== "0x" && (
                    <div className="p-3 rounded-lg bg-accent/30 border border-border">
                      <p className="text-[11px] text-muted-foreground mb-1">Generated calldata:</p>
                      <p className="text-xs font-mono break-all">{calldata}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border divide-y divide-border">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Title</span>
                  <span className="text-sm font-medium text-right max-w-[60%] truncate">{title}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Severity</span>
                  <span className={`text-xs font-medium rounded-md px-2 py-1 ring-1 ring-inset ${SEVERITY_OPTIONS.find((o) => o.value === severity)?.color}`}>
                    {severity}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Target</span>
                  <span className="text-xs font-mono">{targetAddress.slice(0, 10)}...{targetAddress.slice(-6)}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="text-sm font-mono">{value} wei</span>
                </div>
                <div className="px-4 py-3">
                  <span className="text-sm text-muted-foreground block mb-1">Calldata</span>
                  <p className="text-xs font-mono break-all bg-accent/30 rounded p-2">{calldata}</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <span className="text-sm text-muted-foreground block mb-1">Description</span>
                <p className="text-sm whitespace-pre-wrap">{description}</p>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-400">
                  This will create an on-chain governance proposal. Once submitted, it requires 3-of-5 validator votes to pass. The {severity.toLowerCase()} severity has a cooldown of {SEVERITY_OPTIONS.find((o) => o.value === severity)?.delay}.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(STEPS[stepIdx - 1]?.id ?? "details")}
          disabled={stepIdx === 0}
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Back
        </Button>
        {step === "review" ? (
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</> : "Submit Proposal"}
          </Button>
        ) : (
          <Button onClick={() => setStep(STEPS[stepIdx + 1].id)} disabled={!canProceed}>
            Next <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}