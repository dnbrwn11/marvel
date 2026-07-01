// CraftByTrade — the trade composition of the craft workforce at the peak month,
// as a horizontal bar per trade (Concrete/Structure, Steel/Precast, Envelope,
// Mechanical/Plumbing, Electrical, Drywall/Finishes, Specialty), colored per
// CRAFT_TRADES. Derived live from the model; animates on load.

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
import type { CraftManpower } from "../../model/craftManpower";
import { CRAFT_TRADES } from "../../model/craftManpower";
import { shortMonthLabel } from "../../model/arenaCostModel";
import { colors } from "../../brand/tokens";
import { formatNumber } from "../shared/currency";

export function CraftByTrade({ craft, startMonth }: { craft: CraftManpower; startMonth: number }) {
  const data = CRAFT_TRADES.map((t) => ({
    name: t.name,
    workers: craft.monthlyByTrade[t.name]?.[craft.peakMonthIndex] ?? 0,
    color: t.color,
  })).sort((a, b) => b.workers - a.workers);

  return (
    <div className="rounded-xl border border-card bg-surface p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Peak-month craft composition by trade
      </div>
      <p className="mb-4 mt-1 text-xs text-muted">
        Workers at the peak month ({shortMonthLabel(startMonth + craft.peakMonthIndex)})
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={data} margin={{ top: 0, right: 48, left: 8, bottom: 0 }}>
            <XAxis
              type="number"
              tickFormatter={(v) => formatNumber(v)}
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
              formatter={(value) => [`${formatNumber(Number(value))} workers`, "Peak month"]}
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
              dataKey="workers"
              radius={[0, 6, 6, 0]}
              isAnimationActive
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
              <LabelList
                dataKey="workers"
                position="right"
                formatter={(value) => formatNumber(Number(value))}
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
