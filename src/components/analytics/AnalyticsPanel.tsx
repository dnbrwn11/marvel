// AnalyticsPanel — a live analytical tool, not static charts. All views read the
// SAME useArenaModel single source of truth (model + phasing + inputs + rates) via
// context, and animate on load. Because Analytics remounts on tab entry, every
// view re-animates to its new values after the program changes on another tab.
//
// Order: insight strip → benchmarking hero → Decision Impact → cash-flow S-curve
// → donut / cost-by-group breakdown.

import { useArena } from "../../state/ArenaModelContext";
import { InsightStrip } from "./InsightStrip";
import { CostPerSeatBenchmark } from "./CostPerSeatBenchmark";
import { SensitivityPanel } from "./SensitivityPanel";
import { CashFlowChart } from "./CashFlowChart";
import { CostShareDonut } from "./CostShareDonut";
import { CostByGroupChart } from "../summary/CostByGroupChart";

export function AnalyticsPanel() {
  const { inputs, model, phasing, rates } = useArena();

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <InsightStrip model={model} phasing={phasing} inputs={inputs} rates={rates} />
      <CostPerSeatBenchmark model={model} />
      <SensitivityPanel inputs={inputs} model={model} rates={rates} />
      <CashFlowChart phasing={phasing} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CostShareDonut model={model} />
        <CostByGroupChart model={model} />
      </div>
    </div>
  );
}
