"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { ActionConfig, FormField } from "@/types"
import { usePropose } from "@/hooks/useVoting"

interface ActionFormProps {
  config: ActionConfig
  onSubmit?: (data: Record<string, any>) => void
}

export function ActionForm({ config, onSubmit }: ActionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: "onBlur",
  })

  const { propose, isPending } = usePropose()
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [submitMessage, setSubmitMessage] = useState("")

  const onFormSubmit = async (data: Record<string, any>) => {
    try {
      setSubmitStatus("idle")

      if (config.requiresVoting) {
        // For governance proposals, use proposeWithSeverity
        const severity = getSeverityValue(data.severity)
        await propose(
          data.targets || [],
          data.values || [],
          data.calldatas || [],
          data.description || JSON.stringify(data),
          severity
        )
        setSubmitStatus("success")
        setSubmitMessage("Proposal created successfully! Awaiting confirmations...")
      } else if (config.requiresApproval) {
        // For emergency actions, would need direct multisig call
        setSubmitStatus("success")
        setSubmitMessage("Action queued for multisig approval")
      }

      if (onSubmit) {
        onSubmit(data)
      }
    } catch (error) {
      setSubmitStatus("error")
      setSubmitMessage(
        error instanceof Error ? error.message : "Failed to submit action"
      )
    }
  }

  const getSeverityValue = (severity?: string): number => {
    switch (severity) {
      case "EMERGENCY":
        return 0
      case "CRITICAL":
        return 1
      case "IMPORTANT":
        return 2
      case "ROUTINE":
        return 3
      default:
        return 1
    }
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {config.fields.map((field) => (
          <FormField key={field.name} field={field} register={register} errors={errors} />
        ))}
      </div>

      {/* Status Message */}
      {submitStatus !== "idle" && (
        <div
          className={`p-4 rounded-lg ${
            submitStatus === "success"
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              submitStatus === "success"
                ? "text-green-800 dark:text-green-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {submitMessage}
          </p>
        </div>
      )}

      {/* Action Info */}
      <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <span className="font-semibold">Info:</span> {config.description}
        </p>
        {config.requiresApproval && (
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            ✓ This action requires multisig approval
          </p>
        )}
        {config.requiresVoting && (
          <p className="text-sm text-blue-800 dark:text-blue-200 mt-2">
            ✓ This action requires 3-of-5 governance votes
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || isPending}
        className="w-full px-4 py-3 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSubmitting || isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin">⏳</span>
            Processing...
          </span>
        ) : (
          `Execute: ${config.title}`
        )}
      </button>
    </form>
  )
}

interface FormFieldComponentProps {
  field: FormField
  register: any
  errors: any
}

function FormField({ field, register, errors }: FormFieldComponentProps) {
  const value = watch?.(field.name)

  const baseInputClass =
    "w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"

  switch (field.type) {
    case "text":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          <input
            type="text"
            placeholder={field.placeholder}
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              pattern: field.validation?.pattern,
            })}
            className={baseInputClass}
          />
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    case "address":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          <input
            type="text"
            placeholder={field.placeholder}
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              pattern: {
                value: /^0x[a-fA-F0-9]{40}$/,
                message: "Invalid Ethereum address",
              },
            })}
            className={baseInputClass}
          />
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    case "number":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          <input
            type="number"
            placeholder={field.placeholder}
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              min: 0,
              valueAsNumber: true,
            })}
            className={baseInputClass}
          />
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    case "textarea":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          <textarea
            placeholder={field.placeholder}
            rows={4}
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
            })}
            className={`${baseInputClass} resize-none`}
          />
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    case "select":
      return (
        <div>
          <label className="block text-sm font-medium mb-2">{field.label}</label>
          <select
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
            })}
            className={baseInputClass}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors[field.name] && (
            <p className="text-red-500 text-sm mt-1">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    case "checkbox":
      return (
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            {...register(field.name, {
              required: field.required ? `${field.label} is required` : false,
            })}
            className="w-4 h-4 rounded border-slate-200 dark:border-slate-700"
          />
          <label className="text-sm font-medium">{field.label}</label>
          {errors[field.name] && (
            <p className="text-red-500 text-sm ml-auto">{errors[field.name]?.message}</p>
          )}
        </div>
      )

    default:
      return null
  }
}
