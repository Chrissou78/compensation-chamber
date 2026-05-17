"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ACTIONS_CONFIG } from "@/lib/constants";
import { ActionType } from "@/types";
import ActionForm from "@/components/ActionForm";
import {Card, CardContent, CardHeader, CardTitle,} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, CheckCircle, XCircle } from "lucide-react";

export default function ActionPage() {
  const params = useParams();
  const actionId = params?.actionId as string;

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
        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
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
          <ActionForm action={config} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium capitalize">{config.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Approval</span>
                <span className="flex items-center gap-1">
                  {config.requiresApproval ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-400" /> Yes</>
                  ) : (
                    <><XCircle className="h-3 w-3 text-muted-foreground" /> No</>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Voting</span>
                <span className="flex items-center gap-1">
                  {config.requiresVoting ? (
                    <><CheckCircle className="h-3 w-3 text-emerald-400" /> 3-of-5</>
                  ) : (
                    <><XCircle className="h-3 w-3 text-muted-foreground" /> No</>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Required Fields</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {config.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground">No fields required</p>
              ) : (
                config.fields.map((field) => (
                  <div key={field.name} className="flex items-center gap-2 text-sm">
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
                {config.requiresApproval && " This action requires multisig approval."}
                {config.requiresVoting && " A governance vote (3-of-5) is required."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
