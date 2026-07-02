// CostCommandBar — the persistent anchor at the top of the Program & Cost tab.
// Sticky, full-width strip: the escalated-cost hero (count-animated), the
// "where the money is" segmented division bar, and the key stats (cost/seat,
// cost/GSF, hard cost, today's dollars). Reads the shared hook, so it updates
// live while a control is dragged in the drawer. Styling/animation only.
//
// Additive polish (no engine changes):
//  A. Live assumptions strip — clickable chips of the current live inputs.
//  B. Baseline deviation indicator — deep-compares inputs to the RFP defaults.
//  C. Hero delta tag — current escalated total vs the default-inputs baseline.

import { useMemo } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { Tricolor } from "../shared/Tricolor";
import { useCountUp } from "../shared/useCountUp";
import { formatNumber, formatUSD, formatUSDCompact } from "../shared/currency";
import { colors } from "../../brand/tokens";
import { computeModel, DEFAULT_INPUTS, monthLabel, scheduleOutcome } from "../../model/arenaCostModel";
import type { Inputs } from "../../model/types";
import { StackedCostBar } from "../summary/StackedCostBar";

// Deep-compare live inputs to the RFP defaults. All Inputs fields are primitives,
// so a key-wise strict compare is a true deep-equal here (no separate dirty flag).
function inputsEqual(a: Inputs, b: Inputs): boolean {
  return (Object.keys(b) as (keyof Inputs)[]).every((k) => a[k] === b[k]);
}

export function CostCommandBar({
  onAdjustControl,
}: {
  /** Open the Adjust Program drawer scrolled to a specific control id. */
  onAdjustControl?: (id: string) => void;
} = {}) {
  const { inputs, model, reset, resetRates } = useArena();
  const hero = useCountUp(model.constructionCostEscalated, {
    duration: 400,
    mountDuration: 1000,
  });
  const escPct =
    model.constructionCostToday > 0
      ? (model.escalation / model.constructionCostToday) * 100
      : 0;

  // (B) One source of truth for "is this modified from RFP basis?".
  const modified = useMemo(() => !inputsEqual(inputs, DEFAULT_INPUTS), [inputs]);
  // (C) Baseline escalated total = computeModel on the defaults, memoized once.
  const baselineEscalated = useMemo(
    () => computeModel(DEFAULT_INPUTS).constructionCostEscalated,
    [],
  );
  const delta = model.constructionCostEscalated - baselineEscalated;
  const deltaText = `${delta >= 0 ? "+" : "−"}${formatUSDCompact(Math.abs(delta))} vs RFP`;

  const sched = scheduleOutcome(inputs.constructionStartMonth);
  const onReset = () => {
    reset();
    resetRates();
  };

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-card bg-surface/95 p-5 shadow-md backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        {/* Hero */}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Escalated construction cost
          </div>
          {/* Number + delta tag share a baseline row; the number is the first,
              left-anchored child so toggling the tag never shifts the hero. */}
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-4xl font-light tabular-nums tracking-tight text-teal sm:text-5xl">
              {formatUSD(hero)}
            </span>
            {modified && (
              <span
                className={[
                  "inline-flex items-baseline rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums transition-colors",
                  delta >= 0
                    ? "border-magenta/30 bg-magenta/10 text-magenta"
                    : "border-teal/30 bg-teal/10 text-teal",
                ].join(" ")}
              >
                {deltaText}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            start {monthLabel(inputs.constructionStartMonth)} · {escPct.toFixed(1)}%
            escalation ({formatUSD(model.escalation)})
          </div>
          <SeasonFlag startMonth={inputs.constructionStartMonth} />
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Chip label="Cost / seat" value={model.costPerSeat} format={formatUSD} accent={colors.orange} />
          <Chip label="Cost / GSF" value={model.constructionCostEscalated / inputs.gsf} format={formatUSD} accent={colors.purple} />
          <Chip label="Hard cost" value={model.hardCost} format={formatUSDCompact} accent={colors.coral} />
          <Chip label="Today's $" value={model.constructionCostToday} format={formatUSDCompact} accent={colors.magenta} />
        </div>
      </div>

      {/* (A/B) Live assumptions strip — makes the tab read as a live model even
          with the drawer closed. Each chip opens the drawer to its control. */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {modified ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-orange/40 bg-orange/10 px-3 py-1 text-xs font-medium text-orange">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
            Modified from GAP RFP basis
            <button
              type="button"
              onClick={onReset}
              className="ml-0.5 rounded-full bg-orange/15 px-2 py-0.5 text-[11px] font-semibold text-orange transition-colors hover:bg-orange/25"
            >
              Reset to RFP
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal/30 bg-teal/10 px-3 py-1 text-xs font-medium text-teal">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
            GAP RFP basis
          </span>
        )}

        <span className="mx-0.5 hidden h-4 w-px bg-card sm:inline-block" aria-hidden />

        <AssumptionChip value={monthLabel(inputs.constructionStartMonth)} label="NTP" onClick={() => onAdjustControl?.("construction-start")} />
        <AssumptionChip value={sched.scLabel} label="First event" onClick={() => onAdjustControl?.("construction-start")} />
        <AssumptionChip value={formatNumber(inputs.seats)} label="Fixed seats" onClick={() => onAdjustControl?.("seats")} />
        <AssumptionChip value={formatNumber(inputs.clubSeats)} label="Club seats" onClick={() => onAdjustControl?.("club-seats")} />
        <AssumptionChip value={`${escPct.toFixed(1)}%`} label="Blended escalation" onClick={() => onAdjustControl?.("escalation")} />
      </div>

      <Tricolor className="my-4 rounded-full" />

      <StackedCostBar model={model} />
    </div>
  );
}

// A compact, clickable live-input pill: bold value + muted label. Clicking opens
// the Adjust Program drawer scrolled to the matching control.
function AssumptionChip({
  value,
  label,
  onClick,
}: {
  value: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Adjust ${label}`}
      className="group inline-flex items-baseline gap-1.5 rounded-full border border-card bg-panel px-3 py-1 text-xs shadow-sm transition-colors hover:border-teal/40 hover:bg-teal/5"
    >
      <span className="font-display font-semibold tabular-nums text-ink">{value}</span>
      <span className="text-muted transition-colors group-hover:text-teal">{label}</span>
    </button>
  );
}

function SeasonFlag({ startMonth }: { startMonth: number }) {
  const o = scheduleOutcome(startMonth);
  return (
    <span
      className={[
        "mt-2 inline-block rounded-full border px-2.5 py-1 text-xs font-medium",
        o.meets
          ? "border-teal/30 bg-teal/10 text-teal"
          : "border-orange/40 bg-orange/10 text-orange",
      ].join(" ")}
    >
      {o.meets
        ? `✓ SC ${o.scLabel} · meets 2030-31 season`
        : `⚠ SC ${o.scLabel} · misses 2030-31 season`}
    </span>
  );
}

function Chip({
  label,
  value,
  format,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent: string;
}) {
  const shown = useCountUp(value, { duration: 400, mountDuration: 900 });
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <div className="mt-0.5 font-display text-lg font-light tabular-nums text-ink">
        {format(shown)}
      </div>
    </div>
  );
}
