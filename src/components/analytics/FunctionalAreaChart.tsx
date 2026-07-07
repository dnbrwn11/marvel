// FunctionalAreaChart — "Cost by functional area": the direct cost of work
// re-grouped by program function via rollupByFunctionalArea (the same tagged
// line items as the division views, so it always reconciles). Purely derived
// from the shared model prop — no local state — so it re-renders live with the
// Program & Cost drawer. Horizontal bars, descending (selector pre-sorts).
//
// Color encodes program vs. base building, not identity: revenue/program areas
// wear a FIXED GAP accent per area (never index-cycled), while shared base
// building (Building Systems, Envelope) is a muted neutral. Identity and value
// are carried by the axis label and the per-bar $M · % label, never color alone.

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
import type { FunctionalArea, ModelResult } from "../../model/types";
import { rollupByFunctionalArea } from "../../model/arenaCostModel";
import { colors } from "../../brand/tokens";
import { formatUSD, formatUSDCompact } from "../shared/currency";

const MARKUP_GROUP = "Fee, GCs & Markups (GAP submitted rates)";

// Shared base building — deliberately reads as gray so it recedes.
const NEUTRAL = colors.chromeMuted;

// Fixed area → color assignment (stable regardless of sort order or program
// changes). Two accents repeat across the seven program areas; the pairs sit
// far apart in typical cost order and every bar is direct-labeled.
const AREA_COLORS: Record<FunctionalArea, string> = {
  "Site / Parking": colors.teal,
  "Event / Technology": colors.magenta,
  "Premium / Suites": colors.purple,
  "Concourse / Circulation": colors.orange,
  "Back of House / Ops": colors.coral,
  "Seating Bowl": colors.teal,
  "Food & Beverage": colors.magenta,
  "Building Systems": NEUTRAL,
  Envelope: NEUTRAL,
};

export function FunctionalAreaChart({ model }: { model: ModelResult }) {
  // Direct cost of work only: the GMP fee stack is a project-wide markup, not
  // a program function, so it stays out of this re-grouping (per the header).
  const rollup = rollupByFunctionalArea(
    model.items.filter((it) => it.group !== MARKUP_GROUP),
  );
  const data = rollup.map((r) => ({
    ...r,
    barLabel: `${formatUSDCompact(r.cost)} · ${(r.pct * 100).toFixed(1)}%`,
  }));

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Cost by functional area
      </div>
      <p className="mt-1 text-xs text-muted">
        Direct construction cost grouped by program function · shared building
        systems shown separately, not allocated
      </p>
      <div className="mb-2 mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: colors.teal }}
          />
          <span className="text-ink">Program / revenue space</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: NEUTRAL }}
          />
          <span className="text-ink">Shared base building</span>
        </span>
        <span className="text-muted">
          Cost of work only · excludes GC/GRs, fee, contingency &amp; bond
        </span>
      </div>
      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 116, left: 8, bottom: 4 }}
            barCategoryGap="28%"
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="area"
              width={150}
              interval={0}
              tick={{ fill: colors.muted, fontSize: 11 }}
              axisLine={{ stroke: colors.cardBorder }}
              tickLine={false}
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
            />
            <Bar
              dataKey="cost"
              radius={[0, 6, 6, 0]}
              isAnimationActive
              animationDuration={400}
              animationEasing="ease-out"
            >
              {data.map((d) => (
                <Cell key={d.area} fill={AREA_COLORS[d.area]} />
              ))}
              <LabelList
                dataKey="barLabel"
                position="right"
                style={{ fill: colors.ink, fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
