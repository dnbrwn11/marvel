// SensitivityPanel — "Decision Impact": what every program decision costs. Each
// card's dollar delta is computed LIVE by running computeModel with that ONE
// decision changed vs. its baseline (with the current inputs + edited rates) —
// never hardcoded. Deltas count-animate; adds are teal, savings a distinct color.
// Because it calls the real engine, the numbers change when the base program does.

import { computeModel } from "../../model/arenaCostModel";
import type { Inputs, ModelResult, Rates } from "../../model/arenaCostModel";
import { colors } from "../../brand/tokens";
import { useCountUp } from "../shared/useCountUp";
import { formatUSDCompact } from "../shared/currency";

export function SensitivityPanel({
  inputs,
  model,
  rates,
}: {
  inputs: Inputs;
  model: ModelResult;
  rates: Rates;
}) {
  // Escalated total for a one-decision variation of the current program.
  const cost = (patch: Partial<Inputs>) =>
    computeModel({ ...inputs, ...patch }, rates).constructionCostEscalated;
  const base = model.constructionCostEscalated;

  // Each lever = applied option minus its baseline option (marginal impact),
  // evaluated against the CURRENT program, so it moves as the program changes.
  const levers = [
    {
      label: "+1,000 seats",
      scenario: `${(inputs.seats + 1000).toLocaleString()} vs ${inputs.seats.toLocaleString()} seats`,
      delta: cost({ seats: inputs.seats + 1000 }) - base,
    },
    {
      label: "3 ribbon boards",
      scenario: "vs 2 boards",
      delta: cost({ ribbonBoards: 3 }) - cost({ ribbonBoards: 2 }),
    },
    {
      label: "Ice capability",
      scenario: "NHL/AHL ice systems, on vs off",
      delta: cost({ iceCapable: true }) - cost({ iceCapable: false }),
    },
    {
      label: "Signature façade",
      scenario: "signature vs premium enclosure",
      delta: cost({ facadeTier: "signature" }) - cost({ facadeTier: "premium" }),
    },
    {
      label: "All structured → surface parking",
      scenario: `${inputs.parkingStalls.toLocaleString()} stalls to grade`,
      delta: cost({ structuredParkingPct: 0 }) - cost({ structuredParkingPct: 100 }),
    },
    {
      label: "1-year delayed start",
      scenario: "extra escalation from a later start",
      delta: cost({ constructionStartMonth: inputs.constructionStartMonth + 12 }) - base,
    },
  ];

  // Rank by magnitude of impact so the biggest cost/schedule levers lead.
  const orderedLevers = [...levers].sort(
    (a, b) => Math.abs(b.delta) - Math.abs(a.delta),
  );

  return (
    <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        Decision Impact — what every decision costs
      </div>
      <p className="mb-4 mt-1 text-xs text-muted">
        Each figure is the model re-run with that single decision changed · adds in
        teal, savings in magenta
      </p>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {orderedLevers.map((lever) => (
          <DeltaCard key={lever.label} {...lever} />
        ))}
      </div>
    </div>
  );
}

function DeltaCard({
  label,
  scenario,
  delta,
}: {
  label: string;
  scenario: string;
  delta: number;
}) {
  const shown = useCountUp(delta, { duration: 400, mountDuration: 900 });
  const zero = Math.abs(delta) < 1;
  const savings = delta < 0;
  const color = zero ? colors.muted : savings ? colors.magenta : colors.teal;
  const sign = savings ? "−" : delta > 0 ? "+" : "";

  return (
    <div className="flex flex-col rounded-xl border border-card bg-panel/40 p-4 transition-shadow hover:shadow-sm">
      <div className="text-sm font-medium leading-snug text-ink">{label}</div>
      <div
        className="mt-2 font-display text-2xl font-light tabular-nums xl:text-3xl"
        style={{ color }}
      >
        {zero ? "—" : `${sign}${formatUSDCompact(Math.abs(shown))}`}
      </div>
      <div className="mt-1 text-xs text-muted">{scenario}</div>
    </div>
  );
}
