// InsightStrip — the headline stat band at the top of Analytics. Four big
// count-animating cards derived from the live model + phasing: peak annual spend,
// construction duration, cost per seat, and % of budget in the top-3 divisions.
// Animates on load (and on program change, since Analytics remounts on tab entry
// and the numbers re-tween to their new values). All values from the hook.

import type { LineItemGroup, ModelResult, Phasing } from "../../model/types";
import { colors } from "../../brand/tokens";
import { useCountUp } from "../shared/useCountUp";
import { formatUSD, formatUSDCompact } from "../shared/currency";

// Construction window from the RFP schedule: Feb 2028 → Aug 2030 substantial
// completion (≈30 months). A schedule fact, not a cost.
const CONSTRUCTION_MONTHS = 30;

export function InsightStrip({
  model,
  phasing,
}: {
  model: ModelResult;
  phasing: Phasing;
}) {
  const peakSpend = phasing.reduce((m, p) => Math.max(m, p.spend), 0);

  // % of total in the top-3 divisions.
  const totals = new Map<LineItemGroup, number>();
  for (const it of model.items) {
    totals.set(it.group, (totals.get(it.group) ?? 0) + it.cost);
  }
  const sorted = [...totals.values()].sort((a, b) => b - a);
  const grand = sorted.reduce((s, v) => s + v, 0);
  const top3Pct = grand > 0 ? (sorted.slice(0, 3).reduce((s, v) => s + v, 0) / grand) * 100 : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatBig label="Peak annual spend" value={peakSpend} format={formatUSDCompact} sub="busiest construction year" accent={colors.teal} />
      <StatBig label="Construction duration" value={CONSTRUCTION_MONTHS} format={(n) => `${Math.round(n)} mo`} sub="Feb 2028 → Aug 2030" accent={colors.orange} />
      <StatBig label="Cost per seat" value={model.costPerSeat} format={formatUSD} sub="escalated ÷ fixed seats" accent={colors.magenta} />
      <StatBig label="Top-3 divisions" value={top3Pct} format={(n) => `${n.toFixed(1)}%`} sub="share of total budget" accent={colors.purple} />
    </div>
  );
}

function StatBig({
  label,
  value,
  format,
  sub,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub: string;
  accent: string;
}) {
  const shown = useCountUp(value, { duration: 400, mountDuration: 1000 });
  return (
    <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-1.5 font-display text-3xl font-light tabular-nums text-ink">
        {format(shown)}
      </div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  );
}
