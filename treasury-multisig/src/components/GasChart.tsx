// src/components/GasChart.tsx
"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import type { GasReserve } from "@/types";

interface GasChartProps {
  reserves: GasReserve[];
}

export function GasChart({ reserves }: GasChartProps) {
  const data = reserves.map((r) => ({
    name: r.contractName.replace(/([A-Z])/g, " $1").trim().split(" ").slice(0, 2).join(" "),
    current: r.currentBalance,
    target: r.targetBalance,
    threshold: r.refillThreshold,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={{ stroke: "hsl(var(--border))" }}
          tickFormatter={(v) => `${v}`}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            `${formatNumber(value)} MATIC`,
            name === "current" ? "Balance" : name === "target" ? "Target" : "Threshold",
          ]}
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
            fontSize: "0.75rem",
          }}
        />
        <Bar dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Balance" />
        <Bar dataKey="target" fill="#22c55e33" radius={[4, 4, 0, 0]} name="Target" />
        <ReferenceLine y={0.5} stroke="#ef4444" strokeDasharray="5 5" label="" />
      </BarChart>
    </ResponsiveContainer>
  );
}
