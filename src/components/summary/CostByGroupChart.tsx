// CostByGroupChart — cost aggregated by LineItem group, as a recharts bar chart.
// Bars animate/tween whenever the underlying model changes (isAnimationActive +
// a stable dataKey). Light theme, GAP palette cycling. Reads the shared model.

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LineItemGroup, ModelResult } from "../../model/types";
import { chartPalette, colors } from "../../brand/tokens";
import { formatUSDCompact, formatUSD } from "../shared/currency";

// Short labels so the axis stays legible on a light card.
const SHORT: Record<LineItemGroup, string> = {
  "Site & Structure": "Site & Struct.",
  "Enclosure & Interiors": "Enclosure",
  "Seating & Premium": "Seating",
  "MEP & Fire": "MEP & Fire",
  Technology: "Technology",
  "Parking & Site": "Parking",
  "Fee, GCs & Markups (GAP submitted rates)": "Fee & GCs",
};

export function CostByGroupChart({ model }: { model: ModelResult }) {
  const totals = new Map<LineItemGroup, number>();
  for (const item of model.items) {
    totals.set(item.group, (totals.get(item.group) ?? 0) + item.cost);
  }
  const data = Array.from(totals.entries()).map(([group, cost]) => ({
    group: SHORT[group],
    fullGroup: group,
    cost,
  }));

  return (
    <div className="h-80 w-full rounded-xl border border-card bg-surface p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-teal">
        Cost by group
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="group"
            tick={{ fill: colors.muted, fontSize: 11 }}
            axisLine={{ stroke: colors.cardBorder }}
            tickLine={false}
            interval={0}
          />
          <YAxis
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
            formatter={(value) => [formatUSD(Number(value)), "Cost"]}
            labelFormatter={(_, payload) =>
              payload?.[0]?.payload?.fullGroup ?? ""
            }
          />
          <Bar
            dataKey="cost"
            radius={[6, 6, 0, 0]}
            isAnimationActive
            animationDuration={400}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.fullGroup}
                fill={chartPalette[index % chartPalette.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
