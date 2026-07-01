// ManpowerPanel — the "Manpower & Resourcing" tab. Leads with the craft/trade
// workforce curve (peak-workers-per-month), derived LIVE from the cost model via
// deriveCraftManpower(model), with GAP's fixed management-staff plan overlaid.
// Order: headline stats → craft curve (hero) → craft-by-trade → leadership roster.
// Craft values from the hook's model; staff values from staffingData.ts.

import { useArena } from "../../state/ArenaModelContext";
import { deriveCraftManpower } from "../../model/craftManpower";
import { STAFFING } from "../../model/staffingData";
import { colors } from "../../brand/tokens";
import { useCountUp } from "../shared/useCountUp";
import { formatNumber } from "../shared/currency";
import { ManpowerCurve } from "./ManpowerCurve";
import { CraftByTrade } from "./CraftByTrade";
import { LeadershipRoster } from "./LeadershipRoster";

export function ManpowerPanel() {
  const { model, inputs } = useArena();
  const craft = deriveCraftManpower(model);
  const startMonth = inputs.constructionStartMonth;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* Headline stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Peak craft workforce" value={craft.peak} format={(n) => formatNumber(n)} sub="workers at peak month" accent={colors.teal} hero />
        <Stat label="Average craft workforce" value={craft.average} format={(n) => formatNumber(n)} sub="across active months" accent={colors.purple} />
        <Stat label="Total craft hours" value={craft.totalCraftHours} format={(n) => formatNumber(n)} sub="planning estimate" accent={colors.orange} />
        <Stat label="Peak management staff" value={STAFFING.totals.construction_peak_fte} format={(n) => n.toFixed(1)} sub="GAP submitted FTE" accent={colors.magenta} />
      </div>

      {/* Hero craft curve */}
      <ManpowerCurve craft={craft} startMonth={startMonth} />

      {/* Craft composition by trade */}
      <CraftByTrade craft={craft} startMonth={startMonth} />

      {/* Committed management team */}
      <LeadershipRoster />
    </div>
  );
}

function Stat({
  label,
  value,
  format,
  sub,
  accent,
  hero,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub: string;
  accent: string;
  hero?: boolean;
}) {
  const shown = useCountUp(value, { duration: 400, mountDuration: 1000 });
  return (
    <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm">
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={`mt-1.5 font-display font-light tabular-nums ${hero ? "text-4xl text-teal" : "text-3xl text-ink"}`}
      >
        {format(shown)}
      </div>
      <div className="mt-0.5 text-xs text-muted">{sub}</div>
    </div>
  );
}
