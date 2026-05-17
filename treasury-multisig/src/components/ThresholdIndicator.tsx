"use client";

interface ThresholdIndicatorProps {
  forVotes: number;
  requiredVotes?: number;
  totalVoters?: number;
  severity?: "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE";
  showLabel?: boolean;
}

const BAR_COLOR: Record<string, string> = {
  EMERGENCY: "bg-red-500", CRITICAL: "bg-amber-500", IMPORTANT: "bg-yellow-500", ROUTINE: "bg-blue-500",
};

export function ThresholdIndicator({ forVotes, requiredVotes = 3, totalVoters = 5, severity = "CRITICAL", showLabel = true }: ThresholdIndicatorProps) {
  const pct = Math.min((forVotes / requiredVotes) * 100, 100);
  const met = forVotes >= requiredVotes;
  const canReach = forVotes + (totalVoters - forVotes) >= requiredVotes;

  return (
    <div className="rounded-lg border border-border bg-accent/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium">Signature Threshold</p>
          {showLabel && <p className="text-[10px] text-muted-foreground uppercase">{severity}</p>}
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{forVotes}<span className="text-sm font-normal text-muted-foreground">/{requiredVotes}</span></p>
          <p className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</p>
        </div>
      </div>

      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${BAR_COLOR[severity]}`} style={{ width: `${pct}%` }} />
      </div>

      <p className="text-xs text-muted-foreground">
        {met ? "Threshold met — ready for cooldown" : canReach ? `${requiredVotes - forVotes} more vote${requiredVotes - forVotes > 1 ? "s" : ""} needed` : "Cannot reach threshold"}
      </p>
    </div>
  );
}
