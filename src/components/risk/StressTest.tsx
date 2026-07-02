// StressTest — the centerpiece. A master "Stress Test" switch plus per-risk
// "Realize" toggles (parametric risks only; static risks show their range but
// cannot be realized into the engine). When one or more parametric risks are
// realized, the parent composes their inputsDeltas onto the baseline and runs
// computeModel ONCE on a LOCAL shadow copy — this never writes shared inputs.
// The StressedBanner renders that shadow run: stressed escalated total, the
// magenta delta vs baseline, and the season flag from the stressed run.

import { colors } from "../../brand/tokens";
import { formatUSD, formatUSDCompact } from "../shared/currency";
import { useCountUp } from "../shared/useCountUp";
import type { Risk, RiskPrice } from "../../model/riskRegister";

// ── Sticky stressed-model banner ─────────────────────────────────────────────
export function StressedBanner({
  stressedEscalated,
  baselineEscalated,
  seasonMeets,
  realizedCount,
}: {
  stressedEscalated: number;
  baselineEscalated: number;
  seasonMeets: boolean;
  realizedCount: number;
}) {
  const total = useCountUp(stressedEscalated, { duration: 500, mountDuration: 500 });
  const delta = stressedEscalated - baselineEscalated;
  const deltaShown = useCountUp(delta, { duration: 500, mountDuration: 500 });

  return (
    <div className="sticky top-0 z-20 overflow-hidden rounded-2xl border-2 border-magenta/40 bg-surface/95 p-5 shadow-md backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-magenta" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-magenta">
              Stressed Model · {realizedCount} risk{realizedCount === 1 ? "" : "s"} realized
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-4xl font-light tabular-nums tracking-tight text-ink sm:text-5xl">
              {formatUSD(total)}
            </span>
            <span className="inline-flex items-baseline rounded-full border border-magenta/30 bg-magenta/10 px-2.5 py-0.5 text-sm font-semibold tabular-nums text-magenta">
              +{formatUSDCompact(Math.abs(deltaShown))} vs baseline
            </span>
          </div>
          <div className="mt-0.5 text-xs text-muted">
            escalated construction cost under the composed stress scenario
          </div>
        </div>

        {/* Season flag from the STRESSED run (engine's own scheduleOutcome). */}
        <SeasonBadge meets={seasonMeets} />
      </div>
    </div>
  );
}

function SeasonBadge({ meets }: { meets: boolean }) {
  return (
    <div
      className={[
        "flex flex-col items-center rounded-xl border px-5 py-3 text-center transition-colors duration-500",
        meets
          ? "border-teal/40 bg-teal/10"
          : "border-coral/50 bg-coral/10",
      ].join(" ")}
    >
      <span
        className="font-display text-lg font-semibold tracking-wide transition-colors duration-500"
        style={{ color: meets ? colors.teal : colors.coral }}
      >
        {meets ? "✓ 2030-31 MAINTAINED" : "✕ 2030-31 AT RISK"}
      </span>
      <span className="mt-0.5 text-[11px] text-muted">stressed-run season flag</span>
    </div>
  );
}

// ── Master switch + per-risk realize toggle row ──────────────────────────────
export function StressControls({
  stressOn,
  onToggleStress,
  risks,
  prices,
  realized,
  onToggleRealize,
}: {
  stressOn: boolean;
  onToggleStress: (on: boolean) => void;
  risks: Risk[];
  prices: Map<string, RiskPrice>;
  realized: Set<string>;
  onToggleRealize: (id: string) => void;
}) {
  const parametric = risks.filter(
    (r) => r.impact.kind === "parametric" && r.status !== "Retired",
  );
  const staticRisks = risks.filter(
    (r) => r.impact.kind === "static" && r.status !== "Retired",
  );

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-teal">
            Stress Test Mode
          </div>
          <p className="mt-1 text-xs text-muted">
            Realize parametric risks to compose their deltas into one live engine run.
            Switch off to revert instantly — stress state never touches the shared model.
          </p>
        </div>
        {/* Master switch */}
        <button
          type="button"
          role="switch"
          aria-checked={stressOn}
          onClick={() => onToggleStress(!stressOn)}
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold transition-colors",
            stressOn
              ? "border-magenta/40 bg-magenta/10 text-magenta"
              : "border-card bg-panel text-muted hover:text-ink",
          ].join(" ")}
        >
          <span
            className={[
              "relative h-5 w-9 rounded-full transition-colors",
              stressOn ? "bg-magenta" : "bg-card",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-[left] duration-200",
                stressOn ? "left-[18px]" : "left-0.5",
              ].join(" ")}
            />
          </span>
          Stress Test {stressOn ? "ON" : "OFF"}
        </button>
      </div>

      {/* Parametric — realizable */}
      <div className="mt-5 flex flex-wrap gap-2">
        {parametric.map((r) => {
          const on = realized.has(r.id);
          const label =
            r.impact.kind === "parametric" ? r.impact.deltaLabel : "";
          const price = prices.get(r.id);
          return (
            <button
              key={r.id}
              type="button"
              disabled={!stressOn}
              aria-pressed={on}
              onClick={() => onToggleRealize(r.id)}
              className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                !stressOn
                  ? "cursor-not-allowed border-card bg-panel/50 text-muted/60"
                  : on
                    ? "border-magenta/50 bg-magenta/10 text-magenta"
                    : "border-card bg-panel text-ink hover:border-magenta/40 hover:bg-magenta/5",
              ].join(" ")}
              title={
                price
                  ? `Realized impact ${formatUSDCompact(price.mid)} escalated`
                  : undefined
              }
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  on ? "bg-magenta" : "bg-teal",
                ].join(" ")}
              />
              <span className="font-semibold">#{r.num}</span>
              <span className="text-muted">·</span>
              {label}
              {price && (
                <span className="tabular-nums text-teal">
                  {formatUSDCompact(price.mid)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Static — shown but not realizable */}
      {staticRisks.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted">
            Static (range only, not engine-realizable):
          </span>
          {staticRisks.map((r) => {
            const price = prices.get(r.id);
            return (
              <span
                key={r.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-card bg-panel/60 px-2.5 py-1 text-[11px] text-muted"
              >
                <span className="font-semibold text-ink">#{r.num}</span>
                {price
                  ? `${formatUSDCompact(price.low)}–${formatUSDCompact(price.high)}`
                  : ""}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
