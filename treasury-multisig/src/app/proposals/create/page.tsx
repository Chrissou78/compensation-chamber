// src/app/proposals/create/page.tsx
"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { type Address, encodeFunctionData } from "viem";
import { usePropose } from "@/hooks/useVoting";
import {
  ACTIONS_CONFIG,
  CONTRACT_ADDRESSES,
  SEVERITY_DELAYS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/constants";
import {
  TREASURY_ABI,
  REGISTRY_ABI,
  GAS_REFILLER_ABI,
} from "@/lib/abi";
import { ActionType, type ActionConfig } from "@/types";
import { useAppStore } from "@/store";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  Shield,
  FileText,
  Zap,
  Search,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Severity = "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE";
type Step = "usecase" | "fields" | "severity" | "review";

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "usecase", label: "Use Case", icon: FileText },
  { id: "fields", label: "Parameters", icon: Zap },
  { id: "severity", label: "Severity", icon: Shield },
  { id: "review", label: "Review", icon: Check },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDelay(seconds: number, fallback: string): string {
  if (!seconds) return fallback;
  const hours = seconds / 3600;
  return hours >= 24 ? `${hours / 24} days` : `${hours} hours`;
}

const SEVERITY_OPTIONS: {
  value: Severity;
  label: string;
  delay: string;
  color: string;
}[] = [
  {
    value: "EMERGENCY",
    label: "Emergency",
    delay: formatDelay(SEVERITY_DELAYS.EMERGENCY, "0 hours"),
    color: "text-red-400 bg-red-500/10 ring-red-500/20",
  },
  {
    value: "CRITICAL",
    label: "Critical",
    delay: formatDelay(SEVERITY_DELAYS.CRITICAL, "24 hours"),
    color: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  },
  {
    value: "IMPORTANT",
    label: "Important",
    delay: formatDelay(SEVERITY_DELAYS.IMPORTANT, "12 hours"),
    color: "text-blue-400 bg-blue-500/10 ring-blue-500/20",
  },
  {
    value: "ROUTINE",
    label: "Routine",
    delay: formatDelay(SEVERITY_DELAYS.ROUTINE, "4 hours"),
    color: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
  },
];

// ─── Use-case → contract + function mapping ───────────────────────────────────

interface UseCaseMapping {
  target: string;
  abi: readonly Record<string, unknown>[];
  functionName: string;
  buildArgs: (fields: Record<string, string>) => unknown[];
  value?: (fields: Record<string, string>) => bigint;
  autoDescription: (fields: Record<string, string>) => string;
}

const registryAddress = CONTRACT_ADDRESSES.VALIDATOR_REGISTRY;
const treasuryAddress = CONTRACT_ADDRESSES.TREASURY_CONTROLLER;
const gasRefillerAddress = CONTRACT_ADDRESSES.GAS_REFILLER;

const USE_CASE_MAPPINGS: Partial<Record<ActionType, UseCaseMapping>> = {
  [ActionType.PROPOSE_THRESHOLD_CHANGE]: {
    target: registryAddress,
    abi: REGISTRY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "setActionThreshold",
    buildArgs: (f) => {
      const typeMap: Record<string, number> = {
        PAYOUT: 0, REBALANCE: 1, STAKING: 2, UPGRADE: 3, MINTING: 4,
      };
      return [typeMap[f.actionType] ?? 0, Number(f.newThreshold), f.description || ""];
    },
    autoDescription: (f) =>
      `Change signature threshold for ${f.actionType} to ${f.newThreshold}`,
  },
  [ActionType.PROPOSE_ADD_VALIDATOR]: {
    target: registryAddress,
    abi: REGISTRY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "addValidator",
    buildArgs: (f) => [f.validatorAddress, f.validatorName, "Validator"],
    autoDescription: (f) =>
      `Add validator ${f.validatorName} (${f.validatorAddress?.slice(0, 10)}...)`,
  },
  [ActionType.PROPOSE_REMOVE_VALIDATOR]: {
    target: registryAddress,
    abi: REGISTRY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "removeValidator",
    buildArgs: (f) => [f.validatorAddress],
    autoDescription: (f) =>
      `Remove validator ${f.validatorAddress?.slice(0, 10)}...`,
  },
  [ActionType.PROPOSE_BLACKLIST_ADDRESS]: {
    target: registryAddress,
    abi: REGISTRY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "updateValidatorStatus",
    buildArgs: (f) => [f.accountAddress, 2],
    autoDescription: (f) =>
      `Blacklist address ${f.accountAddress?.slice(0, 10)}...`,
  },
  [ActionType.PROPOSE_AUTHORIZE_AGENT]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "authorizeAgent",
    buildArgs: (f) => [f.agentAddress],
    autoDescription: (f) =>
      `Authorize AI agent ${f.agentName} (${f.agentAddress?.slice(0, 10)}...)`,
  },
  [ActionType.PROPOSE_REVOKE_AGENT]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "revokeAgent",
    buildArgs: (f) => [f.agentAddress],
    autoDescription: (f) =>
      `Revoke AI agent at ${f.agentAddress?.slice(0, 10)}...`,
  },
  [ActionType.PROPOSE_UPDATE_DELAY]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "setGasRefiller",
    buildArgs: (f) => [f.newDelay],
    autoDescription: (f) =>
      `Update timelock delay for ${f.severity} to ${f.newDelay}s`,
  },
  [ActionType.PROPOSE_OWNERSHIP_TRANSFER]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "authorizeAgent",
    buildArgs: (f) => [f.newOwner],
    autoDescription: (f) =>
      `Transfer ownership to ${f.newOwner?.slice(0, 10)}...`,
  },
  [ActionType.EXECUTE_PAUSE]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "pause",
    buildArgs: () => [],
    autoDescription: () => "Pause all treasury operations (emergency)",
  },
  [ActionType.EXECUTE_UNPAUSE]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "unpause",
    buildArgs: () => [],
    autoDescription: () => "Unpause all treasury operations",
  },
  [ActionType.EXECUTE_EMERGENCY_REFILL]: {
    target: gasRefillerAddress,
    abi: GAS_REFILLER_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "refill",
    buildArgs: (f) => {
      const cMap: Record<string, string> = {
        TREASURY_CONTROLLER: CONTRACT_ADDRESSES.TREASURY_CONTROLLER,
        PAYOUT_EXECUTOR: CONTRACT_ADDRESSES.TREASURY_CONTROLLER,
        REBALANCING_EXECUTOR: CONTRACT_ADDRESSES.TREASURY_CONTROLLER,
        STAKING_EXECUTOR: CONTRACT_ADDRESSES.TREASURY_CONTROLLER,
      };
      return [cMap[f.contract] || f.contract];
    },
    value: (f) => {
      try { return BigInt(Math.floor(Number(f.amount) * 1e18)); }
      catch { return BigInt(0); }
    },
    autoDescription: (f) =>
      `Emergency gas refill: ${f.amount} MATIC to ${f.contract}`,
  },
  [ActionType.EXECUTE_WITHDRAW]: {
    target: treasuryAddress,
    abi: TREASURY_ABI as unknown as readonly Record<string, unknown>[],
    functionName: "addSupportedToken",
    buildArgs: (f) => [f.recipient],
    autoDescription: (f) =>
      `Emergency withdraw ${f.amount} ${f.token} to ${f.recipient?.slice(0, 10)}...`,
  },
};

// ─── Proposable use cases ─────────────────────────────────────────────────────

const PROPOSABLE_ACTIONS = Object.values(ACTIONS_CONFIG).filter(
  (a) =>
    a.requiresApproval &&
    a.category !== "view" &&
    USE_CASE_MAPPINGS[a.id] !== undefined
);

const baseInput =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateProposalPage() {
  const { isConnected } = useAccount();
  const { propose, isPending } = usePropose();
  const addToast = useAppStore((s) => s.addToast);

  const [step, setStep] = useState<Step>("usecase");
  const [selectedUseCase, setSelectedUseCase] = useState<ActionType | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [severity, setSeverity] = useState<Severity>("ROUTINE");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const stepIdx = STEPS.findIndex((s) => s.id === step);

  const actionConfig: ActionConfig | null = selectedUseCase
    ? ACTIONS_CONFIG[selectedUseCase]
    : null;

  const mapping: UseCaseMapping | null = selectedUseCase
    ? USE_CASE_MAPPINGS[selectedUseCase] ?? null
    : null;

  const filteredActions = useMemo(() => {
    return PROPOSABLE_ACTIONS.filter((a) => {
      const matchesSearch =
        !searchQuery ||
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || a.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, categoryFilter]);

  const setField = useCallback((name: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const canProceed = useMemo(() => {
    switch (step) {
      case "usecase":
        return selectedUseCase !== null;
      case "fields": {
        if (!actionConfig) return false;
        return actionConfig.fields
          .filter((f) => f.required)
          .every((f) => (fieldValues[f.name] ?? "").trim().length > 0);
      }
      case "severity":
        return true;
      case "review":
        return true;
      default:
        return false;
    }
  }, [step, selectedUseCase, actionConfig, fieldValues]);

  const proposalData = useMemo(() => {
    if (!actionConfig || !mapping) return null;
    try {
      const args = mapping.buildArgs(fieldValues);
      const calldata = encodeFunctionData({
        abi: [...(mapping.abi as unknown as Parameters<typeof encodeFunctionData>[0]["abi"])],
        functionName: mapping.functionName,
        args,
      } as unknown as Parameters<typeof encodeFunctionData>[0]);

      const title = actionConfig.title;
      const description =
        fieldValues.description ||
        fieldValues.reason ||
        mapping.autoDescription(fieldValues);
      const msgValue = mapping.value ? mapping.value(fieldValues) : BigInt(0);

      return {
        target: mapping.target as Address,
        calldata: calldata as `0x${string}`,
        value: msgValue,
        title,
        description,
      };
    } catch {
      return null;
    }
  }, [actionConfig, mapping, fieldValues]);

  const severityValue = (s: Severity): number => {
    switch (s) {
      case "EMERGENCY": return 0;
      case "CRITICAL": return 1;
      case "IMPORTANT": return 2;
      default: return 3;
    }
  };

  const handleSubmit = async () => {
    if (!proposalData) return;
    try {
      await propose(
        [proposalData.target],
        [proposalData.value],
        [proposalData.calldata],
        `${proposalData.title}\n\n${proposalData.description}`,
        severityValue(severity)
      );
      addToast({
        type: "success",
        title: "Proposal submitted",
        message: "It will now go through governance voting.",
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed";
      addToast({ type: "error", title: "Proposal failed", message: msg.slice(0, 100) });
    }
  };

  const handleSelectUseCase = (actionType: ActionType) => {
    setSelectedUseCase(actionType);
    setFieldValues({});
  };

  const goNext = () => {
    const nextIdx = stepIdx + 1;
    if (nextIdx < STEPS.length) setStep(STEPS[nextIdx].id);
  };

  const goPrev = () => {
    const prevIdx = stepIdx - 1;
    if (prevIdx >= 0) setStep(STEPS[prevIdx].id);
  };

  // ─── Not connected ──────────────────────────────────────────────────────────

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Connect your wallet to create proposals
        </p>
      </div>
    );
  }

  const categories = ["all", ...new Set(PROPOSABLE_ACTIONS.map((a) => a.category))];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8 max-w-2xl">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/proposals">
          <ArrowLeft className="h-3 w-3 mr-1" /> Proposals
        </Link>
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Proposal</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Select a use case and fill in the parameters — calldata is built automatically.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isActive = s.id === step;
          const isDone = i < stepIdx;
          return (
            <div key={s.id} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className={`h-px w-6 ${isDone ? "bg-primary" : "bg-border"}`}
                />
              )}
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
                {isDone ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Icon className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* ── Step 1: Select Use Case ── */}
          {step === "usecase" && (
            <>
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search use cases..."
                    className={`${baseInput} pl-9`}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`text-xs font-medium px-2.5 py-1 rounded-md ring-1 ring-inset transition-colors ${
                        categoryFilter === cat
                          ? "bg-primary/10 text-primary ring-primary/30"
                          : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                      }`}
                    >
                      {cat === "all"
                        ? "All"
                        : CATEGORY_LABELS[cat] || cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                {filteredActions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No matching use cases found.
                  </p>
                )}
                {filteredActions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleSelectUseCase(action.id)}
                    className={`flex items-start gap-3 rounded-lg px-4 py-3 text-left ring-1 ring-inset transition-colors ${
                      selectedUseCase === action.id
                        ? "bg-primary/10 text-foreground ring-primary/30"
                        : "bg-secondary/50 text-foreground ring-border hover:bg-accent"
                    }`}
                  >
                    <span className="text-xl mt-0.5">{action.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {action.title}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            CATEGORY_COLORS[action.category] || ""
                          }`}
                        >
                          {action.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {action.description}
                      </p>
                      <div className="flex gap-3 mt-1">
                        {action.requiresVoting && (
                          <span className="text-[10px] text-muted-foreground">
                            Requires voting
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {action.fields.length} field
                          {action.fields.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                    {selectedUseCase === action.id && (
                      <Check className="h-4 w-4 text-primary mt-1 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2: Fill Fields ── */}
          {step === "fields" && actionConfig && (
            <>
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-xl">{actionConfig.icon}</span>
                <div>
                  <h3 className="text-sm font-semibold">{actionConfig.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {actionConfig.description}
                  </p>
                </div>
              </div>

              {actionConfig.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  This action requires no additional parameters.
                </p>
              ) : (
                <div className="space-y-4">
                  {actionConfig.fields.map((field) => (
                    <div key={field.name} className="space-y-1.5">
                      <label className="text-sm font-medium">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </label>

                      {field.type === "select" && field.options ? (
                        <select
                          value={fieldValues[field.name] || ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          className={baseInput}
                        >
                          <option value="">Select...</option>
                          {field.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "textarea" ? (
                        <textarea
                          value={fieldValues[field.name] || ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          rows={3}
                          className={`${baseInput} resize-none`}
                        />
                      ) : field.type === "checkbox" ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={fieldValues[field.name] === "true"}
                            onChange={(e) =>
                              setField(field.name, e.target.checked ? "true" : "")
                            }
                            className="rounded border-border"
                          />
                          {field.label}
                        </label>
                      ) : (
                        <input
                          type={field.type === "number" ? "number" : "text"}
                          value={fieldValues[field.name] || ""}
                          onChange={(e) => setField(field.name, e.target.value)}
                          placeholder={field.placeholder}
                          className={`${baseInput} ${
                            field.type === "address" ? "font-mono" : ""
                          }`}
                        />
                      )}

                      {field.validation?.message && (
                        <p className="text-[10px] text-muted-foreground">
                          {field.validation.message}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Auto-generated target & calldata preview */}
              {mapping && (
                <div className="rounded-md bg-muted/50 p-3 space-y-1 mt-2">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    Auto-generated
                  </p>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Target: </span>
                    <span className="font-mono">
                      {mapping.target.slice(0, 10)}...{mapping.target.slice(-6)}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-muted-foreground">Function: </span>
                    <span className="font-mono">{mapping.functionName}()</span>
                  </div>
                  {proposalData && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Calldata: </span>
                      <span className="font-mono text-[10px] break-all">
                        {proposalData.calldata.slice(0, 30)}...
                      </span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* ── Step 3: Severity ── */}
          {step === "severity" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Proposal Severity</label>
                <p className="text-xs text-muted-foreground">
                  Higher severity means shorter cooldown before execution.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSeverity(opt.value)}
                      className={`flex items-center gap-2 rounded-md px-3 py-2.5 text-sm ring-1 ring-inset transition-colors ${
                        severity === opt.value
                          ? opt.color
                          : "bg-secondary text-muted-foreground ring-border hover:bg-accent"
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <div className="text-left">
                        <div className="font-medium text-xs">{opt.label}</div>
                        <div className="text-[10px] opacity-70">
                          {opt.delay} cooldown
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Step 4: Review ── */}
          {step === "review" && actionConfig && proposalData && (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <span className="text-xl">{actionConfig.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold">
                      {proposalData.title}
                    </h3>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        CATEGORY_COLORS[actionConfig.category] || ""
                      }`}
                    >
                      {actionConfig.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </p>
                    <p className="text-sm mt-1">{proposalData.description}</p>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Severity
                    </p>
                    <p className="text-sm mt-1">
                      {SEVERITY_OPTIONS.find((o) => o.value === severity)?.label} —{" "}
                      {SEVERITY_OPTIONS.find((o) => o.value === severity)?.delay}{" "}
                      cooldown
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Parameters
                    </p>
                    <div className="mt-1 space-y-1">
                      {actionConfig.fields.map((field) => (
                        <div key={field.name} className="flex gap-2 text-xs">
                          <span className="text-muted-foreground min-w-[100px]">
                            {field.label}:
                          </span>
                          <span className="font-mono break-all">
                            {fieldValues[field.name] || "—"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/50 p-3 space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      On-chain details
                    </p>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Target: </span>
                      <span className="font-mono break-all">
                        {proposalData.target}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Value: </span>
                      <span className="font-mono">
                        {proposalData.value.toString()} wei
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-muted-foreground">Calldata: </span>
                      <span className="font-mono text-[10px] break-all">
                        {proposalData.calldata}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === "review" && !proposalData && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
              <Loader2 className="h-4 w-4" />
              Failed to build calldata. Please go back and check your parameters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={goPrev}
          disabled={stepIdx === 0}
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Back
        </Button>

        {step === "review" ? (
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !proposalData}
          >
            {isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <Check className="h-3 w-3 mr-1" /> Submit Proposal
              </>
            )}
          </Button>
        ) : (
          <Button size="sm" onClick={goNext} disabled={!canProceed}>
            Next <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}
