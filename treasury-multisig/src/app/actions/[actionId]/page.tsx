"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ACTIONS_CONFIG } from "@/lib/constants";
import { ActionType } from "@/types";
import ActionForm from "@/components/ActionForm";
import {
  useRequiredSignatures,
  useActiveValidatorCount,
} from "@/hooks/useThresholds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ActionPage() {
  const params = useParams();
  const actionId = params?.actionId as string;

  // Track which action type the user selected in the dropdown
  const [selectedActionType, setSelectedActionType] = useState<
    string | undefined
  >(undefined);

  // On-chain reads
  const { requiredSignatures, isLoading: isLoadingSigs } =
    useRequiredSignatures(selectedActionType);
  const { activeCount, isLoading: isLoadingCount } =
    useActiveValidatorCount();

  if (!actionId) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Action not found</p>
      </div>
    );
  }

  const config = ACTIONS_CONFIG[actionId as ActionType];

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-sm text-muted-foreground">Action not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/actions">
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back to Actions
          </Link>
        </Button>
      </div>
    );
  }

  const isThresholdChange =
    actionId === ActionType.PROPOSE_THRESHOLD_CHANGE;

  // Build the voting threshold label for the sidebar
  const totalValidators = activeCount ?? 5;
  const isLoadingThreshold = isLoadingSigs || isLoadingCount;

  const votingLabel = (() => {
    if (!config.requiresVoting) return null;

    // On the threshold-change page, react to dropdown selection
    if (isThresholdChange) {
      if (!selectedActionType) return `select action type`;
      if (isLoadingThreshold) return "loading";
      if (requiredSignatures !== undefined) {
        return `${requiredSignatures}-of-${totalValidators}`;
      }
      return "—";
    }

    // All other voting actions: show active count if we have it
    return `3-of-${totalValidators}`;
  })();

  return (
    <div className="space-y-8">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/actions">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to Actions
        </Link>
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{config.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {config.description}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset bg-blue-500/10 text-blue-400 ring-blue-500/20 capitalize">
            {config.category}
          </span>
          {config.requiresApproval && (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset bg-amber-500/10 text-amber-400 ring-amber-500/20">
              Requires Approval
            </span>
          )}
          {config.requiresVoting && (
            <span className="inline-flex items-center rounded-md px-2 py-1 text-[11px] font-medium ring-1 ring-inset bg-purple-500/10 text-purple-400 ring-purple-500/20">
              Governance Vote
            </span>
          )}
        </div>
      </div>

      {/* Form + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActionForm
            action={config}
            onActionTypeChange={
              isThresholdChange ? setSelectedActionType : undefined
            }
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium capitalize">
                  {config.category}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval</span>
                <span className="flex items-center gap-1">
                  {config.requiresApproval ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-emerald-400" /> Yes
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-muted-foreground" /> No
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voting</span>
                <span className="flex items-center gap-1">
                  {config.requiresVoting ? (
                    votingLabel === "loading" ? (
                      <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : votingLabel === "select action type" ? (
                      <span className="text-xs text-muted-foreground italic">
                        Select action type…
                      </span>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3 text-emerald-400" />{" "}
                        {votingLabel}
                      </>
                    )
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 text-muted-foreground" /> No
                    </>
                  )}
                </span>
              </div>

              {/* Extra row: current on-chain threshold for the selected action */}
              {isThresholdChange && selectedActionType && (
                <div className="flex justify-between border-t border-border pt-3">
                  <span className="text-muted-foreground">
                    Current threshold
                    <span className="block text-[10px] text-muted-foreground/60">
                      {selectedActionType}
                    </span>
                  </span>
                  <span className="font-medium">
                    {isLoadingThreshold ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : requiredSignatures !== undefined ? (
                      `${requiredSignatures}-of-${totalValidators}`
                    ) : (
                      "—"
                    )}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {config.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No fields required
                </p>
              ) : (
                config.fields.map((field) => (
                  <div
                    key={field.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span>{field.label}</span>
                    {field.required && (
                      <span className="text-destructive text-xs">*</span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-border bg-accent/30 p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Fill out the form and review before confirming.
                {config.requiresApproval &&
                  " This action requires multisig approval."}
                {config.requiresVoting && isThresholdChange && selectedActionType && requiredSignatures !== undefined
                  ? ` A governance vote (${requiredSignatures}-of-${totalValidators}) is required for ${selectedActionType}.`
                  : config.requiresVoting
                    ? " A governance vote is required."
                    : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
