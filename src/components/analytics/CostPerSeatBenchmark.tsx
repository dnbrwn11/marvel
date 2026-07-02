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
// cost ÷ seating capacity), in as-built dollars at opening. External benchmarks
// only; values are NOT escalated and NOT derived from the model. Opening year is
// appended to the label to make the year-of-cost basis explicit.
const COMPARABLES = [
  { name: "Fiserv Forum ('18)", perSeat: 30_000 },
  { name: "Chase Center ('19)", perSeat: 77_000 },
  { name: "Intuit Dome ('24)", perSeat: 111_000 },
];

const SELF_LABEL = "Spurs Arena (this model, escalated to '30)";

// Greedy word-wrap so a long category label renders on multiple lines instead of
// truncating (the self label is intentionally verbose about its escalation basis).
function wrapLabel(text: string, maxChars: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

// Custom Y-axis tick: right-anchored, wrapped to as many lines as needed and
// vertically centered on the bar, so no comparable label is ever clipped.
function BenchmarkTick({
  x = 0,
  y = 0,
  payload,
}: {
  x?: number;
  y?: number;
  payload?: { value?: string | number };
}) {
  const lines = wrapLabel(String(payload?.value ?? ""), 24);
  const lineHeight = 12.5;
  const offset = -((lines.length - 1) / 2) * lineHeight + 4;
  return (
    <text x={x} y={y} textAnchor="end" fontSize={12} fill={colors.ink}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} dy={i === 0 ? offset : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export function CostPerSeatBenchmark({ model }: { model: ModelResult }) {
  const data = [
    ...COMPARABLES.map((c) => ({ ...c, self: false })),
    { name: SELF_LABEL, perSeat: Math.round(model.costPerSeat), self: true },
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
              width={176}
              tick={<BenchmarkTick />}
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
      <p className="mt-3 text-xs text-muted">
        Comparables shown in as-built dollars at opening; not escalated to a common year.
      </p>
    </div>
  );
}
