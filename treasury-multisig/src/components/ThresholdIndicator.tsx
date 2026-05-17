"use client"

interface ThresholdIndicatorProps {
  forVotes: number
  requiredVotes?: number
  totalVoters?: number
  severity?: "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE"
  showLabel?: boolean
}

export function ThresholdIndicator({
  forVotes,
  requiredVotes = 3,
  totalVoters = 5,
  severity = "CRITICAL",
  showLabel = true,
}: ThresholdIndicatorProps) {
  const percentage = Math.min((forVotes / requiredVotes) * 100, 100)
  const isThresholdMet = forVotes >= requiredVotes
  const canStillVote = forVotes + (totalVoters - forVotes) >= requiredVotes

  const severityColor = {
    EMERGENCY: "bg-red-500",
    CRITICAL: "bg-orange-500",
    IMPORTANT: "bg-yellow-500",
    ROUTINE: "bg-blue-500",
  }[severity]

  const severityBgColor = {
    EMERGENCY: "bg-red-100 dark:bg-red-900/20",
    CRITICAL: "bg-orange-100 dark:bg-orange-900/20",
    IMPORTANT: "bg-yellow-100 dark:bg-yellow-900/20",
    ROUTINE: "bg-blue-100 dark:bg-blue-900/20",
  }[severity]

  const severityBorderColor = {
    EMERGENCY: "border-red-300 dark:border-red-700",
    CRITICAL: "border-orange-300 dark:border-orange-700",
    IMPORTANT: "border-yellow-300 dark:border-yellow-700",
    ROUTINE: "border-blue-300 dark:border-blue-700",
  }[severity]

  return (
    <div className={`rounded-lg border p-6 ${severityBgColor} ${severityBorderColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-sm">Signature Threshold</h3>
          {showLabel && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{severity}</p>}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">
            {forVotes}
            <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
              /{requiredVotes}
            </span>
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{percentage.toFixed(0)}%</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${severityColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {isThresholdMet ? (
          <>
            <span className="text-lg">✅</span>
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Threshold met! Ready for cooldown.
            </span>
          </>
        ) : canStillVote ? (
          <>
            <span className="text-lg">⏳</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {requiredVotes - forVotes} more votes needed
            </span>
          </>
        ) : (
          <>
            <span className="text-lg">❌</span>
            <span className="text-sm font-medium text-red-700 dark:text-red-300">
              Cannot reach threshold
            </span>
          </>
        )}
      </div>

      {/* Voters Info */}
      <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-600">
        <div className="grid grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <p className="font-medium">For</p>
            <p className="text-base font-bold text-green-600 dark:text-green-400">{forVotes}</p>
          </div>
          <div>
            <p className="font-medium">Against</p>
            <p className="text-base font-bold text-red-600 dark:text-red-400">0</p>
          </div>
          <div>
            <p className="font-medium">Abstain</p>
            <p className="text-base font-bold text-slate-600 dark:text-slate-400">
              {totalVoters - forVotes}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
