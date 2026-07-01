// CostShareDonut — share of total cost by division, complementing the bar chart.
// Reads the shared model, aggregates line items by division, and renders an
// animated donut with a centered total and a percentage legend. Light GAP theme,
// palette cycling.

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { LineItemGroup, ModelResult } from "../../model/types";
import { chartPalette, colors } from "../../brand/tokens";
import { formatUSD, formatUSDCompact } from "../shared/currency";

export function CostShareDonut({ model }: { model: ModelResult }) {
  const totals = new Map<LineItemGroup, number>();
  for (const it of model.items) {
    totals.set(it.group, (totals.get(it.group) ?? 0) + it.cost);
  }
  const data = [...totals.entries()].map(([group, cost]) => ({ group, cost }));
  const total = data.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="rounded-xl border border-card bg-surface p-5 shadow-sm">
      <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-teal">
        Cost share by division
      </div>
      <div className="relative h-72">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="cost"
              nameKey="group"
              innerRadius="58%"
              outerRadius="82%"
              paddingAngle={1.5}
              stroke="none"
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            >
              {data.map((d, idx) => (
                <Cell key={d.group} fill={chartPalette[idx % chartPalette.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [formatUSD(Number(value)), name]}
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${colors.cardBorder}`,
                background: colors.surface,
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              labelStyle={{ color: colors.ink, fontWeight: 600 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-wider text-muted">Total</span>
          <span className="font-display text-2xl font-light tabular-nums text-ink">
            {formatUSDCompact(total)}
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-1.5 text-xs">
        {data.map((d, idx) => (
          <div key={d.group} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: chartPalette[idx % chartPalette.length] }}
            />
            <span className="flex-1 truncate text-ink">{d.group}</span>
            <span className="tabular-nums text-muted">
              {((d.cost / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
