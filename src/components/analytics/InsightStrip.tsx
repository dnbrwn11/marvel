// InsightStrip — the headline stat band at the top of Analytics. Four big
// count-animating cards derived from the live model + inputs: peak annual spend,
// construction duration, cost per seat, and the cost of a schedule delay.
// Animates on load (and on program change, since Analytics remounts on tab entry
// and the numbers re-tween to their new values). All values from the hook.

import { useMemo } from "react";
import { computeModel, scheduleOutcome } from "../../model/arenaCostModel";
import type { Inputs, ModelResult, Phasing, Rates } from "../../model/arenaCostModel";
import { colors } from "../../brand/tokens";
import { useCountUp } from "../shared/useCountUp";
import { formatUSD, formatUSDCompact } from "../shared/currency";

// Construction window from the RFP schedule: Feb 2028 → Aug 2030 substantial
// completion (≈30 months). A schedule fact, not a cost.
const CONSTRUCTION_MONTHS = 30;
const DELAY_MONTHS = 12; // NTP-delay probe horizon

export function InsightStrip({
  model,
  phasing,
  inputs,
  rates,
}: {
  model: ModelResult;
  phasing: Phasing;
  inputs: Inputs;
  rates: Rates;
}) {
  const peakSpend = phasing.reduce((m, p) => Math.max(m, p.spend), 0);

  // Cost of schedule delay: extra escalation per month of NTP slip. Run the engine
  // on the current inputs and again with the start date pushed +12 months (dates
  // ONLY), then take the escalated-total difference ÷ 12. Memoized on inputs+rates.
  const delay = useMemo(() => {
    const current = computeModel(inputs, rates);
    const delayedInputs = {
      ...inputs,
      constructionStartMonth: inputs.constructionStartMonth + DELAY_MONTHS,
    };
    const delayed = computeModel(delayedInputs, rates);
    const perMonth =
      (delayed.constructionCostEscalated - current.constructionCostEscalated) / DELAY_MONTHS;
    // Season flag flip: currently meets the 2030-31 target but the +12mo slip misses.
    const flipsSeason =
      scheduleOutcome(inputs.constructionStartMonth).meets &&
      !scheduleOutcome(delayedInputs.constructionStartMonth).meets;
    return { perMonth, flipsSeason };
  }, [inputs, rates]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatBig label="Peak annual spend" value={peakSpend} format={formatUSDCompact} sub="busiest construction year" accent={colors.teal} />
      <StatBig label="Construction duration" value={CONSTRUCTION_MONTHS} format={(n) => `${Math.round(n)} mo`} sub="Feb 2028 → Aug 2030" accent={colors.orange} />
      <StatBig label="Cost per seat" value={model.costPerSeat} format={formatUSD} sub="escalated ÷ fixed seats" accent={colors.magenta} />
      <StatBig
        label="Cost of schedule delay"
        value={delay.perMonth}
        format={(n) => `$${(n / 1e6).toFixed(1)}M / mo`}
        sub="each month of NTP delay, at current escalation assumptions"
        accent={colors.purple}
        annotation={delay.flipsSeason ? "12-mo delay misses 2030-31 season" : undefined}
      />
    </div>
  );
}

function StatBig({
  label,
  value,
  format,
  sub,
  accent,
  annotation,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  sub: string;
  accent: string;
  /** Optional small red note under the sub-label (e.g. season-target warning). */
  annotation?: string;
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
      {annotation && (
        <div
          className="mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
          style={{ color: "#C13435", backgroundColor: "rgba(230,72,77,0.10)", borderColor: "rgba(230,72,77,0.35)" }}
        >
          ⚠ {annotation}
        </div>
      )}
    </div>
  );
}
