// ExposureTornado — horizontal exposure bars for every non-retired risk, sorted
// descending by probability-weighted exposure. Bars are colored by tier (GMP
// teal, Owner orange, Shared a teal↔orange stripe). Parametric bars carry a
// "LIVE" chip and re-price via CSS width transitions whenever the baseline inputs
// change in the Program & Cost drawer (their weighted exposure is engine-derived).
// Value labels are in $M. Custom div bars (not a recharts vertical chart) because
// each row needs a tier stripe, a LIVE chip, and a live-tweening width.

import { colors } from "../../brand/tokens";
import { formatUSDCompact } from "../shared/currency";
import { weightedExposure } from "../../model/riskRegister";
import type { Risk, RiskPrice, RiskTier } from "../../model/riskRegister";

const TIER_COLOR: Record<RiskTier, string> = {
  GMP: colors.teal,
  Owner: colors.orange,
  Shared: colors.teal, // Shared uses a striped fill (see barBackground)
};

// Striped fill for Shared (split across both tiers); solid for GMP/Owner.
function barBackground(tier: RiskTier): string {
  if (tier === "Shared") {
    return `repeating-linear-gradient(45deg, ${colors.teal} 0, ${colors.teal} 8px, ${colors.orange} 8px, ${colors.orange} 16px)`;
  }
  return TIER_COLOR[tier];
}

export function ExposureTornado({
  entries,
}: {
  entries: { risk: Risk; price: RiskPrice }[];
}) {
  const rows = entries
    .filter((e) => e.risk.status !== "Retired")
    .map((e) => ({ ...e, we: weightedExposure(e.risk, e.price) }))
    .sort((a, b) => b.we - a.we);

  const max = Math.max(1, ...rows.map((r) => r.we));

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal">
          Exposure Tornado — weighted exposure by risk
        </div>
        <Legend />
      </div>

      <div className="mt-5 space-y-2.5">
        {rows.map(({ risk, price, we }) => {
          const pct = Math.max(1.5, (we / max) * 100);
          const isParametric = price.parametric;
          return (
            <div key={risk.id} className="flex items-center gap-3">
              {/* Label column */}
              <div className="flex w-48 shrink-0 items-center gap-1.5 sm:w-64">
                <span className="font-display text-xs font-semibold tabular-nums text-muted">
                  #{risk.num}
                </span>
                <span className="truncate text-xs text-ink" title={risk.title}>
                  {risk.title}
                </span>
              </div>
              {/* Bar column */}
              <div className="relative flex min-w-0 flex-1 items-center">
                <div className="h-5 flex-1 overflow-hidden rounded-md bg-panel">
                  <div
                    className="h-full rounded-md transition-[width] duration-500 ease-out"
                    style={{ width: `${pct}%`, background: barBackground(risk.tier) }}
                  />
                </div>
                <span className="ml-2 w-16 shrink-0 text-right font-display text-xs font-medium tabular-nums text-ink">
                  {formatUSDCompact(we)}
                </span>
                {isParametric && (
                  <span className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-full border border-teal/40 bg-teal/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-teal">
                    <span className="h-1 w-1 animate-pulse rounded-full bg-teal" />
                    Live
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {rows.length === 0 && (
          <div className="py-8 text-center text-sm text-muted">
            All risks retired — no exposure to display.
          </div>
        )}
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3 text-[11px] text-muted">
      <LegendSwatch color={colors.teal} label="GMP" />
      <LegendSwatch color={colors.orange} label="Owner" />
      <span className="inline-flex items-center gap-1.5">
        <span
          className="h-2.5 w-2.5 rounded-sm"
          style={{
            background: `repeating-linear-gradient(45deg, ${colors.teal} 0, ${colors.teal} 3px, ${colors.orange} 3px, ${colors.orange} 6px)`,
          }}
        />
        Shared
      </span>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
