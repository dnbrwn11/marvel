// CashFlowChart — the "how the money spends over time" view. Reads computePhasing
// (from the hook) and plots annual spend as muted bars against the cumulative
// outlay as a teal S-curve, across the real schedule (2028 construction start →
// 2030 substantial completion). Animated. Light GAP theme.

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Phasing } from "../../model/types";
import { colors } from "../../brand/tokens";
import { formatUSD, formatUSDCompact } from "../shared/currency";

export function CashFlowChart({ phasing }: { phasing: Phasing }) {
  return (
    <div className="h-96 w-full rounded-xl border border-card bg-surface p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Cash flow &amp; S-curve
      </div>
      <p className="mb-4 mt-1 text-xs text-muted">
        Annual spend (bars) vs. cumulative outlay (line) · preconstruction 2026 →
        construction start 2028 → substantial completion 2030
      </p>
      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart data={phasing} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.cardBorder} strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={{ stroke: colors.cardBorder }}
            tickLine={false}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => formatUSDCompact(v)}
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) => formatUSDCompact(v)}
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(0,176,168,0.06)" }}
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${colors.cardBorder}`,
              background: colors.surface,
              boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
              fontSize: 13,
            }}
            labelStyle={{ color: colors.ink, fontWeight: 600 }}
            formatter={(value, name) => [formatUSD(Number(value)), name]}
          />
          <Bar
            yAxisId="left"
            dataKey="spend"
            name="Annual spend"
            fill={colors.chromeMuted}
            radius={[4, 4, 0, 0]}
            isAnimationActive
            animationDuration={400}
            animationEasing="ease-out"
          />
          <Line
            yAxisId="right"
            dataKey="cumulative"
            name="Cumulative"
            stroke={colors.teal}
            strokeWidth={3}
            dot={{ r: 3, fill: colors.teal, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive
            animationDuration={400}
            animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
