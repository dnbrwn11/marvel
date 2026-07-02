2// ─────────────────────────────────────────────────────────────────────────────
// CRAFT MANPOWER — parametric derivation from the cost model.
//
// ⚠️  PARAMETRIC: craft (trade) labor is DERIVED from construction cost, not from
//     a real subcontractor loading. Labor ≈ 32% of cost of work; converted to
//     craft-hours at a burdened rate; distributed across the schedule with a
//     realistic ramp-peak-taper; split by trade with typical arena shares.
//     This gives a defensible peak-workforce curve that MOVES with the program.
//     Distinct from the GAP staff plan (management FTE, ~62 peak) in staffingData.ts.
//
// Import ModelResult from the engine; call deriveCraftManpower(model).
// ─────────────────────────────────────────────────────────────────────────────

import type { ModelResult } from "./arenaCostModel";

// tunable assumptions (expose in an "assumptions" note in the UI)
export const CRAFT_ASSUMPTIONS = {
  laborPctOfCost: 0.32,        // craft labor as share of construction (hard) cost
  burdenedRate: 85,            // $/craft-hour, fully burdened
  productiveHoursPerMonth: 160,// per worker
  months: 30,                  // Feb 2028 → Aug 2030 construction window
};

// monthly weighting: ramp up through structure, peak at MEP/interiors, taper
const CURVE_WEIGHTS = [
  0.15,0.25,0.4,0.55,0.7,0.85,1.0,1.15,1.3,1.45,
  1.6,1.7,1.8,1.9,2.0,2.05,2.05,2.0,1.9,1.75,
  1.55,1.35,1.1,0.9,0.7,0.5,0.35,0.25,0.15,0.08,
];

// arena-typical craft trade shares of total craft labor
export const CRAFT_TRADES: { name: string; share: number; color: string }[] = [
  { name: "Concrete / Structure", share: 0.20, color: "#00B0A8" },
  { name: "Steel / Precast", share: 0.12, color: "#4E5BA8" },
  { name: "Envelope / Roofing", share: 0.10, color: "#EC008C" },
  { name: "Mechanical / Plumbing", share: 0.20, color: "#9643FC" },
  { name: "Electrical", share: 0.14, color: "#F5821F" },
  { name: "Drywall / Finishes", share: 0.13, color: "#1D9E75" },
  { name: "Specialty / Seating / AV", share: 0.11, color: "#F86464" },
];

export interface CraftManpower {
  monthlyTotal: number[];        // craft workers per month (the sawtooth)
  monthlyByTrade: Record<string, number[]>; // per-trade monthly workers
  peak: number;                  // peak workforce
  peakMonthIndex: number;
  average: number;               // avg across active months
  totalCraftHours: number;
  laborDollars: number;
  monthLabels: string[];
}

const MONTH_LABELS = (() => {
  // Feb 2028 → ~Aug 2030, 30 months
  const out: string[] = [];
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  let y = 2028, m = 1; // Feb = index 1
  for (let i = 0; i < 30; i++) {
    out.push(`${names[m]} '${String(y).slice(2)}`);
    m++; if (m > 11) { m = 0; y++; }
  }
  return out;
})();

export function deriveCraftManpower(model: ModelResult): CraftManpower {
  const A = CRAFT_ASSUMPTIONS;
  // labor from HARD cost (before markups/escalation is fine; use today's hard cost)
  const laborDollars = model.hardCost * A.laborPctOfCost;
  const totalCraftHours = laborDollars / A.burdenedRate;

  const wSum = CURVE_WEIGHTS.reduce((s, w) => s + w, 0);
  const monthlyTotal = CURVE_WEIGHTS.map((w) => {
    const hrs = (totalCraftHours * w) / wSum;
    return Math.round(hrs / A.productiveHoursPerMonth);
  });

  const monthlyByTrade: Record<string, number[]> = {};
  CRAFT_TRADES.forEach((t) => {
    monthlyByTrade[t.name] = monthlyTotal.map((v) => Math.round(v * t.share));
  });

  const peak = Math.max(...monthlyTotal);
  const peakMonthIndex = monthlyTotal.indexOf(peak);
  const active = monthlyTotal.filter((v) => v > 0);
  const average = Math.round(active.reduce((s, v) => s + v, 0) / active.length);

  return {
    monthlyTotal, monthlyByTrade, peak, peakMonthIndex, average,
    totalCraftHours: Math.round(totalCraftHours),
    laborDollars: Math.round(laborDollars),
    monthLabels: MONTH_LABELS,
  };
}
