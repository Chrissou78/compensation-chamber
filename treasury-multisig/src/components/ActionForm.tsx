"use client";

import { useForm, FieldValues } from "react-hook-form";
import { useState } from "react";
import { type Address } from "viem";
import { usePropose, usePauseTreasury, useRefillGas, useAuthorizeAgent } from "@/hooks/useVoting";
import { ActionConfig, ActionType, FormField as FormFieldType } from "@/types";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";

function getSeverityValue(severity: string): number {
  switch (severity?.toUpperCase()) {
    case "EMERGENCY": return 0;
    case "CRITICAL": return 1;
    case "IMPORTANT": return 2;
    case "ROUTINE": return 3;
    default: return 3;
  }
}

function FormField({
  field,
  register,
  errors,
}: {
  field: FormFieldType;
  register: ReturnType<typeof useForm>["register"];
  errors: Record<string, any>;
}) {
  const baseClasses =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-colors";
  const errorClasses = errors[field.name] ? "border-destructive" : "";

  const buildRegisterOptions = () => {
    const opts: Record<string, any> = {};
    if (field.required) {
      opts.required = `${field.label} is required`;
    }
    if (field.type === "number") {
      opts.valueAsNumber = true;
      opts.min = { value: 0, message: `${field.label} must be positive` };
    } else if (field.type === "address") {
      opts.pattern = {
        value: /^0x[a-fA-F0-9]{40}$/,
        message: "Invalid Ethereum address",
      };
    } else if (field.validation?.pattern) {
      opts.pattern = {
        value: field.validation.pattern,
        message: field.validation.message || "Invalid format",
      };
    }
    return opts;
  };

  const registerOptions = buildRegisterOptions();

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <textarea
            {...register(field.name, registerOptions)}
            placeholder={field.placeholder || ""}
            rows={4}
            className={`${baseClasses} ${errorClasses} resize-none`}
          />
          {errors[field.name] && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      );
    case "select":
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <select
            {...register(field.name, registerOptions)}
            className={`${baseClasses} ${errorClasses}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors[field.name] && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register(field.name)}
            className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-ring"
          />
          <label className="text-sm font-medium text-foreground">
            {field.label}
          </label>
        </div>
      );
    default:
      return (
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </label>
          <input
            type={field.type === "number" ? "number" : "text"}
            {...register(field.name, registerOptions)}
            placeholder={field.placeholder || ""}
            className={`${baseClasses} ${errorClasses}`}
          />
          {errors[field.name] && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {errors[field.name]?.message as string}
            </p>
          )}
        </div>
      );
  }
}

export default function ActionForm({ action }: { action: ActionConfig }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ mode: "onBlur" });

  const { propose, isPending: isProposing } = usePropose();
  const { pause, unpause, isPending: isPausing } = usePauseTreasury();
  const { refillGas, isPending: isRefilling } = useRefillGas();
  const { authorizeAgent, revokeAgent, isPending: isAuthorizing } = useAuthorizeAgent();

  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const isPending = isProposing || isPausing || isRefilling || isAuthorizing;

  const onSubmit = async (data: FieldValues) => {
    try {
      setStatus({ type: null, message: "" });

      switch (action.id) {
        // ── Emergency actions (direct contract calls) ──
        case ActionType.EXECUTE_PAUSE:
          pause();
          setStatus({ type: "success", message: "Pause transaction submitted." });
          break;

        case ActionType.EXECUTE_UNPAUSE:
          unpause();
          setStatus({ type: "success", message: "Unpause transaction submitted." });
          break;

        case ActionType.EXECUTE_EMERGENCY_REFILL: {
          const contractKey = data.contract as keyof typeof CONTRACT_ADDRESSES;
          const addr = CONTRACT_ADDRESSES[contractKey] as Address;
          refillGas(addr, String(data.amount));
          setStatus({ type: "success", message: "Refill transaction submitted." });
          break;
        }

        case ActionType.PROPOSE_AUTHORIZE_AGENT:
          authorizeAgent(data.agentAddress as Address);
          setStatus({ type: "success", message: "Agent authorization submitted." });
          break;

        case ActionType.PROPOSE_REVOKE_AGENT:
          revokeAgent(data.agentAddress as Address);
          setStatus({ type: "success", message: "Agent revocation submitted." });
          break;

        // ── Governance proposals ──
        default:
          if (action.requiresVoting) {
            const severity = data.severity || "ROUTINE";
            await propose(
              [data.targetAddress || "0x0000000000000000000000000000000000000000"],
              [BigInt(data.value || 0)],
              [data.calldata || "0x"],
              data.description || action.title,
              getSeverityValue(severity)
            );
            setStatus({
              type: "success",
              message: "Proposal submitted! It will go through governance voting.",
            });
          } else {
            setStatus({
              type: "success",
              message: "Action submitted for multisig approval. Awaiting signatures.",
            });
          }
          break;
      }

      reset();
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Transaction failed. Please try again.",
      });
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">
          {action.requiresVoting
            ? "Submit Governance Proposal"
            : "Execute Action"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {status.type && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-lg border p-4 ${
              status.type === "success"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-destructive/30 bg-destructive/10 text-destructive"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
            )}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {action.fields?.map((field) => (
            <FormField
              key={field.name}
              field={field}
              register={register}
              errors={errors}
            />
          ))}

          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              {action.requiresVoting
                ? "This action creates a governance proposal that requires validator voting before execution."
                : action.requiresApproval
                  ? "This action requires multisig approval from the required number of validators."
                  : "This action will be executed immediately upon submission."}
            </p>
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : action.requiresVoting ? (
              "Submit Proposal"
            ) : (
              "Execute Action"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
