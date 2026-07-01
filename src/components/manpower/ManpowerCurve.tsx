// ManpowerCurve — the hero of the Manpower tab. Craft workforce (derived live from
// the cost model) as a teal area sawtooth across the schedule, with GAP's fixed
// management-staff plan overlaid as a thin magenta line on a secondary axis:
// "≈1,266 craft managed by ≈62 staff at peak." Draws/animates on load; the craft
// peak point is labeled. Craft data from deriveCraftManpower(model); staff from
// staffingData.ts.

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CraftManpower } from "../../model/craftManpower";
import { STAFFING } from "../../model/staffingData";
import { shortMonthLabel } from "../../model/arenaCostModel";
import { colors } from "../../brand/tokens";
import { formatNumber } from "../shared/currency";

export function ManpowerCurve({ craft, startMonth }: { craft: CraftManpower; startMonth: number }) {
  const data = craft.monthlyTotal.map((c, i) => ({
    month: shortMonthLabel(startMonth + i),
    craft: c,
    staff: STAFFING.constructionMonthly[i] ?? 0,
  }));
  const peakMonth = shortMonthLabel(startMonth + craft.peakMonthIndex);

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm sm:p-8">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Craft workforce curve
      </div>
      <h2 className="mt-1 font-display text-2xl font-light text-ink">
        ≈{formatNumber(craft.peak)} craft managed by ≈
        {STAFFING.totals.construction_peak_fte} staff at peak
      </h2>
      <p className="mb-5 mt-1 text-xs text-muted">
        Craft workforce derived parametrically from the program cost model —
        planning estimate, not a subcontractor loading.
      </p>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="craftFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.teal} stopOpacity={0.35} />
                <stop offset="100%" stopColor={colors.teal} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={colors.cardBorder} strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tick={{ fill: colors.muted, fontSize: 10 }}
              axisLine={{ stroke: colors.cardBorder }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              yAxisId="craft"
              tickFormatter={(v) => formatNumber(v)}
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <YAxis
              yAxisId="staff"
              orientation="right"
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${colors.cardBorder}`,
                background: colors.surface,
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                fontSize: 13,
              }}
              labelStyle={{ color: colors.ink, fontWeight: 600 }}
              formatter={(value, name) => [
                `${formatNumber(Number(value))}${name === "Mgmt staff (FTE)" ? " FTE" : ""}`,
                name,
              ]}
            />
            <Area
              yAxisId="craft"
              type="monotone"
              dataKey="craft"
              name="Craft workers"
              stroke={colors.teal}
              strokeWidth={2}
              fill="url(#craftFill)"
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <Line
              yAxisId="staff"
              type="monotone"
              dataKey="staff"
              name="Mgmt staff (FTE)"
              stroke={colors.magenta}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationDuration={900}
              animationEasing="ease-out"
            />
            <ReferenceDot
              yAxisId="craft"
              x={peakMonth}
              y={craft.peak}
              r={5}
              fill={colors.teal}
              stroke={colors.surface}
              strokeWidth={2}
              label={{
                value: `Peak ≈ ${formatNumber(craft.peak)}`,
                position: "top",
                fill: colors.ink,
                fontSize: 12,
                fontWeight: 600,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: colors.teal }} />
          Craft workforce (per month)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-0.5 w-4" style={{ backgroundColor: colors.magenta }} />
          GAP management staff (FTE, right axis)
        </span>
      </div>
    </div>
  );
}
