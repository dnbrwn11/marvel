// ─────────────────────────────────────────────────────────────────────────────
// SHARED MODEL TYPES
// Extracted from arenaCostModel.ts so UI, state, and future engine features
// (staffing/phasing) share one type vocabulary. The engine implementation lives
// in arenaCostModel.ts; the contracts live here.
// ─────────────────────────────────────────────────────────────────────────────

// ── INPUTS (what the client toggles/slides in the demo) ──────────────────────
export interface Inputs {
  seats: number;             // fixed seating capacity
  gsf: number;               // total building gross square feet
  suites: number;            // premium suites
  clubSeats: number;         // club seats
  parkingStalls: number;     // structured parking stalls
  ribbonBoards: 2 | 3;       // LED ribbon board count
  techTier: "standard" | "premium" | "flagship";  // scoreboard / AV / broadcast
  iceCapable: boolean;       // NHL/AHL ice capability (refrigeration, dehumid, etc.)
  facadeTier: "standard" | "premium" | "signature"; // exterior enclosure level
  siteComplexity: "low" | "medium" | "high";        // urban site / foundations
  structuredParkingPct: number;  // % of parkingStalls that are structured (rest surface)
  premiumPct: number;            // % of GSF that is premium / club space
  leedTier: "none" | "silver" | "gold" | "platinum"; // sustainability certification
  scoreboardTier: "standard" | "premium" | "marquee"; // center-hung scoreboard tier
  constructionStartMonth: number; // start date as months since year 0 (year*12 + monthIndex)
  annualEscalationRate: number;   // annual % escalation; compounds start→midpoint
  // ── GAP submitted GMP fee structure (real submitted rates, not placeholders) ─
  gcGrPct: number;           // general conditions / general requirements % (GAP: $72,332,434 GC lump)
  feePct: number;            // Contractor's Fee %
  contingencyPct: number;    // Construction Contingency at GMP %
  preconFeePct: number;      // Preconstruction fee % (GAP: $3,858,416 lump)
  bondPct: number;           // Payment & Performance bond, % of contract value
  changeOrderMarkupPct: number; // CO markup % — stored for reference, NOT in base total
}

export type LineItemGroup =
  | "Site & Structure"
  | "Enclosure & Interiors"
  | "Seating & Premium"
  | "MEP & Fire"
  | "Technology"
  | "Parking & Site"
  | "Fee, GCs & Markups (GAP submitted rates)";

// ── COMPONENT MODEL ──────────────────────────────────────────────────────────
// Trade-level line item, estimate-style: division (group) · label · quantity
// basis · unit rate · extended cost. qty/unit/unitRate are optional so pure
// lump-sum allocations (no natural quantity) remain valid.
export interface LineItem {
  key: string;
  label: string;
  group: LineItemGroup;
  cost: number;        // extended cost, today's dollars
  basis: string;       // human-readable quantity basis (e.g. "750,000 GSF × $31.38")
  qty?: number;        // quantity for the unit-rate takeoff
  unit?: string;       // unit of measure for qty (e.g. "GSF", "seat", "stall")
  unitRate?: number;   // $ per unit (extended cost ÷ qty)
}

export interface ModelResult {
  items: LineItem[];
  hardCost: number;
  gcGr: number;
  fee: number;
  contingency: number;
  preconFee: number;
  bond: number;
  constructionCostToday: number;
  escalation: number;
  constructionCostEscalated: number;
  costPerSeat: number;
}

// ── PHASING (for the animated site map / time view) ──────────────────────────
// Zones follow the RFP trade sequence (Feb 2028 construction start → Aug 2030
// substantial completion → Sept 2030 first event), with preconstruction ahead.
export type PhaseZone =
  | "precon"
  | "civil"
  | "structural"
  | "garage"
  | "archExterior"
  | "archInterior"
  | "mechanical"
  | "electrical"
  | "lowVoltage"
  | "specialty"
  | "commissioning";

export interface PhaseElement {
  key: string;
  label: string;
  startYear: number;
  endYear: number;
  zone: PhaseZone; // site footprint zone this maps to (for the SVG site map)
}

export interface PhaseYear {
  year: number;
  spend: number;
  cumulative: number;
}

export type Phasing = PhaseYear[];
