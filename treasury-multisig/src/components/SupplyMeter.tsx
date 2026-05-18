// src/components/SupplyMeter.tsx
"use client";

import { formatNumber } from "@/lib/utils";

interface SupplyMeterProps {
  minted: number;
  maxSupply: number;
  label?: string;
}

export function SupplyMeter({ minted, maxSupply, label = "TGV Supply" }: SupplyMeterProps) {
  const pct = maxSupply > 0 ? (minted / maxSupply) * 100 : 0;
  const clampedPct = Math.min(pct, 100);
  const color =
    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{pct.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
        <div
          className={`h-3 rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${clampedPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{formatNumber(minted, 0)} minted</span>
        <span>{formatNumber(maxSupply, 0)} max</span>
      </div>
    </div>
  );
}
