// ─────────────────────────────────────────────────────────────────────────────
// RISK REGISTER — data + exposure math for the pursuit Risk Register tab.
//
// STRICTLY ADDITIVE. This module NEVER edits the engine. It imports the existing
// computeModel / scheduleOutcome / RATES and reads their output. It does not
// reimplement any date, season, or escalation math.
//
// SINGLE SOURCE OF TRUTH: no risk stores a computed dollar figure for a
// PARAMETRIC impact. Parametric impacts are priced ONLY by running computeModel
// on the baseline inputs with the risk's inputsDelta applied, and differencing
// the escalated totals. Static impacts store planning-grade low/high USD ranges
// as data (they are not engine-priced by design).
//
// PERSISTENCE: user edits (probability, status, mitigation) persist under
// "marvel_risks_v1" as a per-id override map. Structural fields (title, tier,
// impact deltas, …) are ALWAYS re-seeded from the SEED_RISKS below, so a
// recalibration in code propagates without wiping the user's edits.
// ─────────────────────────────────────────────────────────────────────────────

import { computeModel, RATES, scheduleOutcome } from "./arenaCostModel";
import type { Rates } from "./arenaCostModel";
// The engine's input contract. Spec calls this "ModelInputs"; the existing type
// is `Inputs` — alias it so inputsDelta conforms to the REAL field names/units.
import type { Inputs as ModelInputs } from "./types";

// ── TYPES ────────────────────────────────────────────────────────────────────
export type RiskTier = "GMP" | "Owner" | "Shared";
export type RiskStatus = "Open" | "Mitigating" | "Retired";

export type RiskImpact =
  | { kind: "static"; lowUSD: number; highUSD: number }
  | { kind: "parametric"; inputsDelta: Partial<ModelInputs>; deltaLabel: string };

export interface Risk {
  id: string;
  num: number;
  title: string;
  category: string;
  tier: RiskTier;
  probability: 1 | 2 | 3 | 4 | 5;
  status: RiskStatus;
  owner: string;
  mitigation: string;
  impact: RiskImpact;
}

// ── SEED DATA ────────────────────────────────────────────────────────────────
// Structural definition of every risk. Static ranges are authored in $M and
// expanded to real USD here so the exposure math and the engine-priced
// parametric impacts share one unit (real dollars). inputsDelta values are
// ADDITIVE offsets in the engine's own units:
//   • constructionStartMonth — integer months (NTP slip), added to baseline
//   • annualEscalationRate    — percentage points, added to baseline
//   • clubSeats               — count, added to baseline
const M = 1_000_000;

// Static-range helper: values given in $M.
const staticM = (lowM: number, highM: number): RiskImpact => ({
  kind: "static",
  lowUSD: lowM * M,
  highUSD: highM * M,
});

export const SEED_RISKS: Risk[] = [
  {
    id: "R01", num: 1,
    title: "ITC site acquisition slips past end-2026",
    category: "Land", tier: "Owner", probability: 4, status: "Open",
    owner: "City/UTSA — GAP monitors",
    mitigation: "Early-works packages decoupled from arena parcel; NTP-flex phasing plan",
    impact: { kind: "parametric", inputsDelta: { constructionStartMonth: 8 }, deltaLabel: "NTP +8 mo" },
  },
  {
    id: "R02", num: 2,
    title: "Federal parcel conditions delay enabling works",
    category: "Land", tier: "Owner", probability: 2, status: "Open",
    owner: "City/GSA",
    mitigation: "Sequence enabling scope off critical path",
    impact: staticM(5, 15),
  },
  {
    id: "R03", num: 3,
    title: "Archeological/historic finds at Hemisfair-adjacent parcel",
    category: "Land", tier: "Shared", probability: 3, status: "Open",
    owner: "Shared",
    mitigation: "Pre-NTP archeological survey; discovery protocol in GMP assumptions",
    impact: staticM(3, 10),
  },
  {
    id: "R04", num: 4,
    title: "Utility relocation unknowns at ITC parcel",
    category: "Site", tier: "GMP", probability: 3, status: "Open",
    owner: "GAP",
    mitigation: "Early SUE investigation; relocation allowance defined in GMP basis",
    impact: staticM(4, 12),
  },
  {
    id: "R05", num: 5,
    title: "Design development growth vs RFP basis (premium program, roof/rigging)",
    category: "Design", tier: "Owner", probability: 4, status: "Open",
    owner: "SS&E/Design",
    mitigation: "Milestone estimates at SD/DD/CD; variance-to-baseline reporting via this model",
    impact: { kind: "parametric", inputsDelta: { clubSeats: 500 }, deltaLabel: "Premium program +500 club seats" },
  },
  {
    id: "R06", num: 6,
    title: "Compressed precon runway to Feb 2028 NTP",
    category: "Design", tier: "Shared", probability: 4, status: "Open",
    owner: "Shared",
    mitigation: "Progressive design-assist packages; long-lead releases ahead of full CDs",
    impact: { kind: "parametric", inputsDelta: { constructionStartMonth: 4 }, deltaLabel: "NTP +4 mo" },
  },
  {
    id: "R07", num: 7,
    title: "Escalation exceeds baseline (steel, aluminum, electrical gear, tariffs)",
    category: "Market", tier: "GMP", probability: 3, status: "Open",
    owner: "GAP",
    mitigation: "Early buyout of volatile divisions; indexed allowances where owner elects",
    impact: { kind: "parametric", inputsDelta: { annualEscalationRate: 1.0 }, deltaLabel: "Escalation +100 bps" },
  },
  {
    id: "R08", num: 8,
    title: "Long-lead equipment: switchgear, chillers, vertical transport",
    category: "Procurement", tier: "GMP", probability: 4, status: "Open",
    owner: "GAP",
    mitigation: "Pre-purchase program at NTP; approved-equal spec strategy",
    impact: staticM(5, 15),
  },
  {
    id: "R09", num: 9,
    title: "Sub market saturation — concurrent convention center, Alamodome, ballpark, district work",
    category: "Market", tier: "GMP", probability: 4, status: "Open",
    owner: "GAP",
    mitigation: "GAP tri-partner sub relationships; early trade-partner engagement; bid-coverage tracking",
    impact: staticM(12, 35),
  },
  {
    id: "R10", num: 10,
    title: "Craft availability at ~1,366 peak; wage escalation",
    category: "Labor", tier: "GMP", probability: 3, status: "Open",
    owner: "GAP",
    mitigation: "Workforce development with local partners; peak-shaving via schedule logic",
    impact: staticM(8, 20),
  },
  {
    id: "R11", num: 11,
    title: "Community benefits / council conditions add scope or delay",
    category: "Political", tier: "Owner", probability: 3, status: "Open",
    owner: "City/SS&E",
    mitigation: "Track council actions; price CBA scope as alternates",
    impact: staticM(5, 25),
  },
  {
    id: "R12", num: 12,
    title: "Funding/definitive-agreement sequencing delays past YE 2026",
    category: "Political", tier: "Owner", probability: 3, status: "Open",
    owner: "City/County/SS&E",
    mitigation: "Phased agreements; precon proceeds under LNTP",
    impact: { kind: "parametric", inputsDelta: { constructionStartMonth: 6 }, deltaLabel: "NTP +6 mo" },
  },
  {
    id: "R13", num: 13,
    title: "Downtown logistics: laydown scarcity, César Chávez corridor, adjacent construction",
    category: "Logistics", tier: "GMP", probability: 4, status: "Open",
    owner: "GAP",
    mitigation: "District-level logistics plan; shared laydown negotiation; night-delivery windows",
    impact: staticM(5, 12),
  },
  {
    id: "R14", num: 14,
    title: "Season flip — NTP slip beyond mid-2028 misses 2030-31 opening",
    category: "Schedule", tier: "Shared", probability: 3, status: "Open",
    owner: "Shared",
    mitigation: "This model's date lever governs every precon decision; season flag reviewed at each milestone",
    impact: { kind: "parametric", inputsDelta: { constructionStartMonth: 12 }, deltaLabel: "NTP +12 mo" },
  },
];

// ── DELTA COMPOSITION ────────────────────────────────────────────────────────
// inputsDelta values are ADDITIVE offsets. applyDelta adds numeric deltas onto
// the baseline (so "NTP +8" shifts the real constructionStartMonth by +8, using
// the engine's own date representation — no invented offset field). Non-numeric
// fields, if ever present, replace. Composing several deltas simply sums the
// per-field offsets, so multiple realized parametric risks stack in one run.
export function composeDeltas(deltas: Partial<ModelInputs>[]): Partial<ModelInputs> {
  const out: Partial<ModelInputs> = {};
  for (const d of deltas) {
    for (const key of Object.keys(d) as (keyof ModelInputs)[]) {
      const dv = d[key];
      const cur = out[key];
      if (typeof dv === "number") {
        (out[key] as number) = (typeof cur === "number" ? cur : 0) + dv;
      } else if (dv !== undefined) {
        (out[key] as ModelInputs[typeof key]) = dv as ModelInputs[typeof key];
      }
    }
  }
  return out;
}

export function applyDelta(base: ModelInputs, delta: Partial<ModelInputs>): ModelInputs {
  const out: ModelInputs = { ...base };
  for (const key of Object.keys(delta) as (keyof ModelInputs)[]) {
    const dv = delta[key];
    const bv = base[key];
    if (typeof dv === "number" && typeof bv === "number") {
      (out[key] as number) = bv + dv;
    } else if (dv !== undefined) {
      (out[key] as ModelInputs[typeof key]) = dv as ModelInputs[typeof key];
    }
  }
  return out;
}

// ── EXPOSURE MATH (pure) ─────────────────────────────────────────────────────
export interface RiskPrice {
  low: number;
  high: number;
  mid: number;
  parametric: boolean;
  /** For parametric risks: does the DELAYED run still meet the 2030-31 season?
   *  From the engine's own scheduleOutcome — not reimplemented here. */
  seasonMeets?: boolean;
}

// Price a single risk. Static → its stored low/high range. Parametric → the
// engine-computed escalated-total difference between the delta-applied inputs and
// the baseline inputs (single source of truth; no stored dollar figure). The
// optional baselineEscalated lets callers pass one memoized baseline run so N
// risks don't each recompute it.
export function priceRisk(
  risk: Risk,
  baselineInputs: ModelInputs,
  rates: Rates = RATES,
  baselineEscalated?: number,
): RiskPrice {
  if (risk.impact.kind === "static") {
    const { lowUSD, highUSD } = risk.impact;
    return { low: lowUSD, high: highUSD, mid: (lowUSD + highUSD) / 2, parametric: false };
  }
  const delayed = applyDelta(baselineInputs, risk.impact.inputsDelta);
  const base =
    baselineEscalated ?? computeModel(baselineInputs, rates).constructionCostEscalated;
  const impact = computeModel(delayed, rates).constructionCostEscalated - base;
  return {
    low: impact,
    high: impact,
    mid: impact,
    parametric: true,
    seasonMeets: scheduleOutcome(delayed.constructionStartMonth).meets,
  };
}

// Probability-weighted exposure. Retired risks contribute nothing.
export function weightedExposure(risk: Risk, price: RiskPrice): number {
  if (risk.status === "Retired") return 0;
  return (risk.probability / 5) * price.mid;
}

export interface TierRollup {
  gmp: number;
  owner: number;
}

// Sum weighted exposure by tier. "Shared" splits 50/50 across GMP and Owner.
export function rollupByTier(
  entries: { risk: Risk; price: RiskPrice }[],
): TierRollup {
  let gmp = 0;
  let owner = 0;
  for (const { risk, price } of entries) {
    const we = weightedExposure(risk, price);
    if (we === 0) continue;
    if (risk.tier === "GMP") gmp += we;
    else if (risk.tier === "Owner") owner += we;
    else {
      gmp += we * 0.5;
      owner += we * 0.5;
    }
  }
  return { gmp, owner };
}

// ── PERSISTENCE (user edits only) ────────────────────────────────────────────
export const RISK_STORAGE_KEY = "marvel_risks_v1";

// Only these three fields are user-editable and persisted. Everything else is
// re-seeded from SEED_RISKS so structural recalibration propagates on refresh.
export interface RiskOverride {
  probability?: 1 | 2 | 3 | 4 | 5;
  status?: RiskStatus;
  mitigation?: string;
}
export type RiskOverrideMap = Record<string, RiskOverride>;

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

const STATUSES: RiskStatus[] = ["Open", "Mitigating", "Retired"];

// Keep only well-formed override fields so a partially corrupt entry degrades to
// its seed value instead of crashing consumers.
function sanitizeOverride(v: unknown): RiskOverride | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: RiskOverride = {};
  if (typeof o.probability === "number" && o.probability >= 1 && o.probability <= 5) {
    out.probability = Math.round(o.probability) as 1 | 2 | 3 | 4 | 5;
  }
  if (typeof o.status === "string" && STATUSES.includes(o.status as RiskStatus)) {
    out.status = o.status as RiskStatus;
  }
  if (typeof o.mitigation === "string") out.mitigation = o.mitigation;
  return Object.keys(out).length ? out : null;
}

// Read the persisted override map. Returns {} when uninitialized or corrupt (the
// register then renders pure seed data — the "seed from defaults if empty" rule).
export function readRiskOverrides(): RiskOverrideMap {
  if (!hasStorage()) return {};
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(RISK_STORAGE_KEY);
  } catch {
    return {};
  }
  if (raw === null) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: RiskOverrideMap = {};
    for (const [id, val] of Object.entries(parsed as Record<string, unknown>)) {
      const ov = sanitizeOverride(val);
      if (ov) out[id] = ov;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeRiskOverrides(map: RiskOverrideMap): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(RISK_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* quota / private mode — in-memory state still works */
  }
}

export function clearRiskOverrides(): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.removeItem(RISK_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// Merge persisted user edits onto the code-seeded risks. Structural fields always
// come from SEED_RISKS; only probability/status/mitigation can be overridden.
export function mergeRisks(map: RiskOverrideMap): Risk[] {
  return SEED_RISKS.map((r) => {
    const ov = map[r.id];
    if (!ov) return r;
    return {
      ...r,
      probability: ov.probability ?? r.probability,
      status: ov.status ?? r.status,
      mitigation: ov.mitigation ?? r.mitigation,
    };
  });
}
