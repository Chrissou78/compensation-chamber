"use client"

import { useEffect, useState } from "react"
import { getTimeRemaining } from "@/lib/utils"

interface CooldownTimerProps {
  readyForExecutionAt: number
  severity?: "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE"
  onExpired?: () => void
}

export function CooldownTimer({
  readyForExecutionAt,
  severity = "CRITICAL",
  onExpired,
}: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("")
  const [isExpired, setIsExpired] = useState(false)

  const severityColor = {
    EMERGENCY: "text-red-600 dark:text-red-400",
    CRITICAL: "text-orange-600 dark:text-orange-400",
    IMPORTANT: "text-yellow-600 dark:text-yellow-400",
    ROUTINE: "text-blue-600 dark:text-blue-400",
  }[severity]

  const severityBgColor = {
    EMERGENCY: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
    CRITICAL: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    IMPORTANT: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    ROUTINE: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
  }[severity]

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const remaining = readyForExecutionAt - now

      if (remaining <= 0) {
        setTimeRemaining("Expired")
        setIsExpired(true)
        if (onExpired) onExpired()
      } else {
        setTimeRemaining(getTimeRemaining(readyForExecutionAt))
        setIsExpired(false)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [readyForExecutionAt, onExpired])

  if (!timeRemaining) return null

  return (
    <div className={`rounded-lg border p-4 ${severityBgColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
            Cooldown Period
          </p>
          <p className={`text-sm font-medium mt-1 ${isExpired ? "text-green-600 dark:text-green-400" : severityColor}`}>
            {isExpired ? "✅ Ready to Execute" : `⏱️ ${timeRemaining} remaining`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">Severity</p>
          <p className="text-sm font-bold mt-1 uppercase">{severity}</p>
        </div>
      </div>

      {isExpired && (
        <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
          <p className="text-xs text-green-700 dark:text-green-300 font-medium">
            ✓ This proposal is ready to execute. Click the Execute button to finalize.
          </p>
        </div>
      )}

      {!isExpired && (
        <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Wait for the cooldown period to expire before executing the proposal.
          </p>
        </div>
      )}
    </div>
  )
}
