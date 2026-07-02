// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO METRICS — derive the comparison numbers from stored INPUTS at render
// time. Nothing here is persisted; everything is a pure function of `inputs` run
// through the SAME engine the rest of the app uses (computeModel), the SAME craft
// derivation (deriveCraftManpower), and the SAME schedule/season logic
// (scheduleOutcome). This guarantees a compared scenario can never disagree with
// what the live tabs would show for those same inputs.
// ─────────────────────────────────────────────────────────────────────────────

import { computeModel, scheduleOutcome } from "../model/arenaCostModel";
import { deriveCraftManpower } from "../model/craftManpower";
import type { Inputs } from "../model/types";

export interface ScenarioMetrics {
  costOfWork: number;      // model.hardCost — Cost of Work (today's $)
  totalToday: number;      // model.constructionCostToday — Total (today's $)
  escalatedTotal: number;  // model.constructionCostEscalated — Escalated Total
  firstEventMonth: number; // substantial completion / first event (months since yr 0)
  firstEventLabel: string; // e.g. "Aug 2030"
  meetsSeason: boolean;    // engine's 2030-31 season flag
  peakCraft: number;       // peak craft workforce from the craft curve
  costPerSeat: number;
}

// Derive every comparison metric for one set of inputs. Uses the engine's default
// rate table (computeModel's default) so results are deterministic and tie to the
// RFP baseline — inputs are the single persisted lever.
export function metricsFor(inputs: Inputs): ScenarioMetrics {
  const model = computeModel(inputs);
  const sched = scheduleOutcome(inputs.constructionStartMonth);
  const craft = deriveCraftManpower(model);
  return {
    costOfWork: model.hardCost,
    totalToday: model.constructionCostToday,
    escalatedTotal: model.constructionCostEscalated,
    firstEventMonth: sched.scMonth,
    firstEventLabel: sched.scLabel,
    meetsSeason: sched.meets,
    peakCraft: craft.peak,
    costPerSeat: model.costPerSeat,
  };
}
