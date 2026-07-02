// ScenarioCompare — the side-by-side "Functional Analysis" card: RFP Baseline vs a
// selected saved scenario. Every number is derived at render time via metricsFor()
// (computeModel on stored inputs); nothing is read from persisted output. Below the
// two columns sits a row of GAP-brand delta badges. The concept-level disclaimer is
// embedded here so it stays visible even while this view is shown in a dialog.

import type { ReactNode } from "react";
import type { Inputs } from "../../model/types";
import { metricsFor } from "../../scenarios/scenarioMetrics";
import type { ScenarioMetrics } from "../../scenarios/scenarioMetrics";
import type { Scenario } from "../../scenarios/scenarioStore";
import { formatNumber, formatUSD, formatUSDCompact } from "../shared/currency";
import { DeltaBadge } from "./DeltaBadge";
import type { BadgeTone } from "./DeltaBadge";

// Numeric-sign → badge tone. Per spec: positive/neutral reads teal, negative reads
// magenta (sign of the delta, baseline → scenario).
function toneForDelta(v: number): BadgeTone {
  return v >= 0 ? "pos" : "neg";
}

// Signed compact currency, e.g. "+$12.3M" / "−$5.0M" / "±$0".
function signedUSD(v: number): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "±";
  return `${sign}${formatUSDCompact(Math.abs(v))}`;
}
function signedInt(v: number, unit: string): string {
  const sign = v > 0 ? "+" : v < 0 ? "−" : "±";
  return `${sign}${formatNumber(Math.abs(v))} ${unit}`;
}
function signedMonths(v: number): string {
  if (v === 0) return "same date";
  const sign = v > 0 ? "+" : "−";
  const n = Math.abs(v);
  return `${sign}${n} mo`;
}

// Green MAINTAINED / red AT RISK season flag — distinct from the brand teal/magenta
// used for cost deltas, per spec. Inline styles keep the exact green/red tones.
function SeasonChip({ meets }: { meets: boolean }) {
  const style = meets
    ? { color: "#0F8F6B", backgroundColor: "rgba(29,158,117,0.12)", borderColor: "rgba(29,158,117,0.35)" }
    : { color: "#C13435", backgroundColor: "rgba(230,72,77,0.12)", borderColor: "rgba(230,72,77,0.35)" };
  return (
    <span
      className="inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={style}
    >
      {meets ? "✓ 2030-31 season · maintained" : "⚠ 2030-31 season · at risk"}
    </span>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-card py-2.5 first:border-t-0">
      <span className="pt-1 text-xs font-medium uppercase tracking-wider text-muted">{label}</span>
      <span className="text-right">
        <span className="block font-display text-lg font-light tabular-nums text-ink">{value}</span>
        {sub && <span className="mt-1 block">{sub}</span>}
      </span>
    </div>
  );
}

function Column({ title, tag, m, highlight }: { title: string; tag: string; m: ScenarioMetrics; highlight?: boolean }) {
  return (
    <div className={`p-5 ${highlight ? "bg-teal/5" : "bg-surface"}`}>
      <div className="mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{tag}</div>
        <div className="truncate font-display text-base font-medium text-ink" title={title}>{title}</div>
      </div>
      <Row label="Cost of Work" value={formatUSD(m.costOfWork)} sub={<span className="text-[11px] text-muted">today's $</span>} />
      <Row label="Total" value={formatUSD(m.totalToday)} sub={<span className="text-[11px] text-muted">today's $</span>} />
      <Row label="Escalated Total" value={formatUSD(m.escalatedTotal)} />
      <Row label="First Event" value={m.firstEventLabel} sub={<SeasonChip meets={m.meetsSeason} />} />
      <Row label="Peak Craft Manpower" value={`${formatNumber(m.peakCraft)}`} sub={<span className="text-[11px] text-muted">workers at peak</span>} />
    </div>
  );
}

export function ScenarioCompare({
  baselineInputs,
  scenario,
}: {
  baselineInputs: Inputs;
  scenario: Scenario;
}) {
  const base = metricsFor(baselineInputs);
  const scen = metricsFor(scenario.inputs);

  const dCostOfWork = scen.costOfWork - base.costOfWork;
  const dTotal = scen.totalToday - base.totalToday;
  const dEscalated = scen.escalatedTotal - base.escalatedTotal;
  const dMonths = scen.firstEventMonth - base.firstEventMonth;
  const dPeak = scen.peakCraft - base.peakCraft;

  return (
    <div className="rounded-2xl border border-card bg-surface shadow-sm">
      {/* Card header */}
      <div className="border-b border-card px-5 py-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-teal">Functional Analysis</div>
        <div className="mt-0.5 font-display text-lg font-light text-ink">
          RFP Baseline <span className="text-muted">vs</span> {scenario.name}
        </div>
      </div>

      {/* Side-by-side columns */}
      <div className="grid grid-cols-2 divide-x divide-card">
        <Column tag="Baseline" title="RFP Baseline" m={base} />
        <Column tag="Scenario" title={scenario.name} m={scen} highlight />
      </div>

      {/* Delta badges */}
      <div className="border-t border-card px-5 py-4">
        <div className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Deltas · baseline → scenario
        </div>
        <div className="flex flex-wrap gap-3">
          <DeltaBadge label="Δ Cost of Work (today's $)" value={signedUSD(dCostOfWork)} tone={toneForDelta(dCostOfWork)} />
          <DeltaBadge label="Δ Total (today's $)" value={signedUSD(dTotal)} tone={toneForDelta(dTotal)} />
          <DeltaBadge label="Δ Escalated Total" value={signedUSD(dEscalated)} tone={toneForDelta(dEscalated)} />
          <DeltaBadge
            label="Δ First Event"
            value={`${scen.firstEventLabel} · ${signedMonths(dMonths)}`}
            tone="schedule"
            sub={<SeasonChip meets={scen.meetsSeason} />}
          />
          <DeltaBadge label="Δ Peak Craft Manpower" value={signedInt(dPeak, "workers")} tone={toneForDelta(dPeak)} />
        </div>
      </div>

      {/* Persistent concept-level disclaimer (kept visible on the compare view) */}
      <div className="rounded-b-2xl border-t border-card bg-panel px-5 py-3">
        <p className="text-center text-[11px] leading-relaxed text-muted">
          Concept-level parametric model — planning assumptions, not an estimate.
        </p>
      </div>
    </div>
  );
}
