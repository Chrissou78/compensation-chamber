"use client";

import { useEffect, useState } from "react";
import { getTimeRemaining } from "@/lib/utils";
import { Clock, CheckCircle } from "lucide-react";

interface CooldownTimerProps {
  readyForExecutionAt: number;
  severity?: "EMERGENCY" | "CRITICAL" | "IMPORTANT" | "ROUTINE";
  onExpired?: () => void;
}

export function CooldownTimer({ readyForExecutionAt, severity = "CRITICAL", onExpired }: CooldownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      if (readyForExecutionAt - now <= 0) { setTimeRemaining("Expired"); setIsExpired(true); if (onExpired) onExpired(); }
      else { setTimeRemaining(getTimeRemaining(readyForExecutionAt)); setIsExpired(false); }
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [readyForExecutionAt, onExpired]);

  if (!timeRemaining) return null;

  return (
    <div className="rounded-lg border border-border bg-accent/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isExpired ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Cooldown</p>
            <p className={`text-sm font-medium ${isExpired ? "text-emerald-400" : "text-foreground"}`}>
              {isExpired ? "Ready to Execute" : `${timeRemaining} remaining`}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{severity}</span>
      </div>
    </div>
  );
}
