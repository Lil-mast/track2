"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { recoveryTrend, riskDistribution } from "@/lib/data";

const tooltipStyle = {
  backgroundColor: "oklch(0.185 0.005 270)",
  border: "1px solid oklch(0.27 0.005 270)",
  borderRadius: "0.5rem",
  fontSize: "0.75rem",
  color: "oklch(0.96 0.003 270)",
};

export function RecoveryTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={recoveryTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="recoveredFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.78 0.16 160)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="oklch(0.78 0.16 160)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="atRiskFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.62 0.2 25)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="oklch(0.62 0.2 25)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.005 270)" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="oklch(0.65 0.005 270)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.65 0.005 270)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(value: number, name: string) => [
            `$${(value / 1000).toFixed(0)}k`,
            name === "recovered" ? "Recovered" : "At Risk",
          ]}
        />
        <Area
          type="monotone"
          dataKey="recovered"
          stroke="oklch(0.78 0.16 160)"
          strokeWidth={2}
          fill="url(#recoveredFill)"
        />
        <Area
          type="monotone"
          dataKey="atRisk"
          stroke="oklch(0.62 0.2 25)"
          strokeWidth={2}
          fill="url(#atRiskFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function RiskDistributionChart() {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={riskDistribution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.27 0.005 270)" vertical={false} />
        <XAxis
          dataKey="range"
          stroke="oklch(0.65 0.005 270)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="oklch(0.65 0.005 270)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          cursor={{ fill: "oklch(0.23 0.005 270)" }}
          formatter={(value: number) => [`${value} accounts`, "Count"]}
          labelFormatter={(label: string) => `Risk score ${label}`}
        />
        <Bar dataKey="count" fill="oklch(0.78 0.16 160)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
