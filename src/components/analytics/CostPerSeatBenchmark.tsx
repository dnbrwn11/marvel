// CostPerSeatBenchmark — horizontal bars comparing this arena's cost-per-seat
// (from the model) against a few public NBA-arena comparables. The comparables
// are approximate external figures (construction cost ÷ seats) — the ONLY
// hardcoded costs here, clearly labeled. "Spurs Arena (this model)" is teal.

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ModelResult } from "../../model/types";
import { colors } from "../../brand/tokens";
import { formatUSD, formatUSDCompact } from "../shared/currency";

// Public comparables — APPROXIMATE, from public reporting (total construction
// cost ÷ seating capacity). External benchmarks only; NOT derived from the model.
const COMPARABLES = [
  { name: "Fiserv Forum", perSeat: 30_000 },
  { name: "Chase Center", perSeat: 77_000 },
  { name: "Intuit Dome", perSeat: 111_000 },
];

export function CostPerSeatBenchmark({ model }: { model: ModelResult }) {
  const data = [
    ...COMPARABLES.map((c) => ({ ...c, self: false })),
    { name: "Spurs Arena (this model)", perSeat: Math.round(model.costPerSeat), self: true },
  ].sort((a, b) => a.perSeat - b.perSeat);

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Cost-per-seat benchmarking
      </div>
      <h2 className="mt-1 font-display text-2xl font-light text-ink">
        A top-tier arena program at a disciplined cost per seat
      </h2>
      <p className="mb-5 mt-1 text-xs text-muted">
        Public comparables, approximate · construction cost ÷ seats
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 60, left: 8, bottom: 0 }}
          >
            <XAxis
              type="number"
              tickFormatter={(v) => formatUSDCompact(v)}
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={150}
              tick={{ fill: colors.ink, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,176,168,0.06)" }}
              formatter={(value) => [formatUSD(Number(value)), "Cost / seat"]}
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${colors.cardBorder}`,
                background: colors.surface,
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              labelStyle={{ color: colors.ink, fontWeight: 600 }}
            />
            <Bar
              dataKey="perSeat"
              radius={[0, 6, 6, 0]}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.self ? colors.teal : colors.chromeMuted} />
              ))}
              <LabelList
                dataKey="perSeat"
                position="right"
                formatter={(value) => formatUSDCompact(Number(value))}
                fill={colors.muted}
                fontSize={11}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
