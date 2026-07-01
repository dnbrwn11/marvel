// AssumptionsPanel — an expandable "Assumptions / Unit Rates" section that makes
// the engine's key unit rates editable live. Rates flow through useArenaModel as
// state (rates + setRate), so editing any value recomputes the whole model — the
// hero count-animates and the breakdown/stacked bar re-tween, same as a slider.
// The markup percentages (Inputs) are editable here too. "Reset to defaults"
// restores the RATES baseline and the default markup stack. Calc logic unchanged.

import { useState } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { DEFAULT_INPUTS } from "../../model/arenaCostModel";
import type { Rates } from "../../model/arenaCostModel";
import type { Inputs } from "../../model/types";

// Key unit rates exposed for editing (subset of the RATES block).
const RATE_FIELDS: { key: keyof Rates; label: string; unit: string; step: number }[] = [
  { key: "superstructure", label: "Superstructure", unit: "$/GSF", step: 1 },
  { key: "enclosurePremium", label: "Enclosure (premium tier)", unit: "$/GSF", step: 1 },
  { key: "mechPlumb", label: "MEP — mechanical & plumbing", unit: "$/GSF", step: 1 },
  { key: "electrical", label: "Electrical", unit: "$/GSF", step: 1 },
  { key: "seatingBowl", label: "Seating bowl", unit: "$/seat", step: 10 },
  { key: "parkingPerStall", label: "Parking — structured", unit: "$/stall", step: 100 },
];

// Markup percentages (part of Inputs) — shown here so the whole assumption set is
// adjustable in one place.
const MARKUP_FIELDS: { key: keyof Inputs; label: string }[] = [
  { key: "gcGrPct", label: "General conditions / GRs" },
  { key: "feePct", label: "Contractor's fee" },
  { key: "contingencyPct", label: "Construction contingency" },
  { key: "preconFeePct", label: "Preconstruction fee" },
  { key: "bondPct", label: "P&P bond" },
];

export function AssumptionsPanel() {
  const { rates, setRate, resetRates, inputs, setInput } = useArena();
  const [open, setOpen] = useState(false);

  const resetAll = () => {
    resetRates();
    for (const f of MARKUP_FIELDS) setInput(f.key, DEFAULT_INPUTS[f.key]);
  };

  return (
    <section className="rounded-xl border border-card bg-surface shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-6 py-4 text-left"
      >
        <Chevron open={open} />
        <span className="flex-1">
          <span className="block text-xs font-semibold uppercase tracking-wider text-teal">
            Assumptions / Unit Rates
          </span>
          <span className="block text-xs text-muted">
            Planning unit rates — adjustable; replace with detailed estimate as
            design advances.
          </span>
        </span>
      </button>

      {open && (
        <div className="border-t border-card px-6 py-5">
          <div className="space-y-3">
            {RATE_FIELDS.map((f) => (
              <RateRow
                key={f.key}
                label={f.label}
                unit={f.unit}
                step={f.step}
                value={rates[f.key]}
                onChange={(v) => setRate(f.key, v)}
              />
            ))}
          </div>

          <div className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-teal">
            Markups (GAP submitted)
          </div>
          <div className="space-y-3">
            {MARKUP_FIELDS.map((f) => (
              <RateRow
                key={f.key}
                label={f.label}
                unit="%"
                step={0.01}
                value={inputs[f.key] as number}
                onChange={(v) => setInput(f.key, v as never)}
              />
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-muted">
              Edits cascade through the whole model instantly.
            </span>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-md border border-card px-3 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-panel"
            >
              Reset to defaults
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function RateRow({
  label,
  unit,
  value,
  step,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3">
      <span className="min-w-0 text-sm text-ink">
        {label}
        <span className="ml-1.5 text-xs text-muted">— {unit}</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={0}
        value={value}
        onChange={(e) => {
          const v = e.target.value === "" ? 0 : Number(e.target.value);
          if (!Number.isNaN(v)) onChange(v);
        }}
        className="w-28 shrink-0 rounded-md border border-card bg-panel px-2 py-1 text-right text-sm tabular-nums text-ink outline-none transition-colors focus:border-teal focus:bg-surface"
      />
    </label>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${
        open ? "rotate-90" : ""
      }`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 5l6 5-6 5V5z" />
    </svg>
  );
}
