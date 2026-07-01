// ─────────────────────────────────────────────────────────────────────────────
// SPURS ARENA — PARAMETRIC PROGRAM COST MODEL  (concept-level, PLANNING ONLY)
//
// ⚠️  These are PARAMETRIC PLANNING ASSUMPTIONS derived from public NBA-arena
//     comparables and general cost data — NOT a PCL estimate and NOT priced
//     scope. Every rate in RATES below is a PLACEHOLDER to be replaced with
//     PCL estimating data before use. The tool's credibility comes from these
//     being PCL's numbers.
//
// ARCHITECTURE: this is the single source of truth. UI toggles set `Inputs`;
// `computeModel(inputs)` returns the full cost breakdown. BOTH the Cost Summary
// view AND the animated site map render off computeModel() — never off separate
// data — so nothing can contradict anything else. Shared type contracts live in
// ./types.ts.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  Inputs,
  LineItem,
  ModelResult,
  PhaseElement,
  Phasing,
} from "./types";

export type {
  Inputs,
  LineItem,
  LineItemGroup,
  ModelResult,
  PhaseElement,
  PhaseYear,
  Phasing,
  PhaseZone,
} from "./types";

// ── 1. DEFAULT INPUTS ────────────────────────────────────────────────────────
// Program values are the REAL RFP parameters; the fee stack is GAP Partners'
// ACTUAL submitted GMP structure (see COST_BASIS_NOTE).
export const DEFAULT_INPUTS: Inputs = {
  seats: 18000,              // RFP: 17,000–18,000 seated (19,000+ total capacity)
  gsf: 750000,               // planning assumption
  suites: 44,                // planning assumption
  clubSeats: 2000,           // planning assumption
  parkingStalls: 2500,       // RFP: explicitly requires 2,500 stalls
  ribbonBoards: 2,
  techTier: "premium",
  iceCapable: false,
  facadeTier: "premium",
  siteComplexity: "high",
  structuredParkingPct: 100,   // all structured by default
  premiumPct: 12,              // % of GSF that is premium/club space
  leedTier: "silver",          // sustainability certification target
  scoreboardTier: "premium",   // center-hung scoreboard tier
  // GAP submitted a firm GMP for the 2028–2030 window, so escalation-to-midpoint
  // is already embedded in the Cost of Work — base-case escalation is 0.
  escalationPct: 0,
  // GAP's ACTUAL submitted fee structure (real, not placeholders):
  gcGrPct: 8.23,             // GAP submitted $72,332,434 GC lump (= 8.23% of Cost of Work)
  feePct: 3.25,              // Contractor's Fee
  contingencyPct: 3,         // Construction Contingency at GMP
  preconFeePct: 0.44,        // GAP: $3,858,416 precon lump
  bondPct: 0.85,             // Payment & Performance bond, % of contract value
  changeOrderMarkupPct: 4,   // stored for reference; NOT applied in base total
};

// Labeled cost-basis / excluded-scope note for the UI to display.
export const COST_BASIS_NOTE =
  "Basis: GAP Cost of Work / GMP construction cost (ties to submitted GC and fee). " +
  "Excludes owner soft costs, FF&E, design fees, land, and financing. " +
  "Public ~$1.3B figure includes owner costs outside CM scope.";

// ── 2. RATES  (calibrated to GAP's submitted Cost of Work) ────────────────────
// Recalibrated from the original planning placeholders: every driver scaled by
// ~0.7925 so the base-case Cost of Work (hard cost + subs, before markups) lands
// near GAP's submitted ~$879M (implied by their $72.3M GC lump ÷ 8.23%). Still
// isolated here so swapping in refined estimating data is a single-block edit.
export const RATES = {
  // $/GSF driven
  superstructure: 142.65,    // structure + long-span roof
  enclosureStd: 75.29, enclosurePremium: 91.14, enclosureSignature: 118.88, // façade $/GSF
  concourseFnB: 75.29,
  interiors: 55.48,
  mechPlumb: 134.73,
  electrical: 69.74,
  fireProt: 11.89,
  lowVoltSecurity: 31.7,

  // $/seat driven
  seatingBowl: 1823,

  // lump sums ($)
  premiumSpaces: 75_287_500,     // suites + clubs base (scales with counts below)
  premiumPerSuite: 673_625,      // marginal $ per suite beyond/below base 44
  premiumPerClubSeat: 7_133,     // marginal $ per club seat beyond/below base 2000
  backOfHouse: 41_210_000,
  conveying: 20_605_000,
  siteDevelopment: 35_662_500,

  // technology tiers (scoreboard + AV + broadcast), $
  techStandard: 33_285_000, techPremium: 49_135_000, techFlagship: 69_740_000,
  ribbonBoardEach: 5_151_250,    // marginal cost per ribbon board

  // ice capability adder ($): refrigeration plant, dasher systems, dehumid, floor
  iceCapability: 22_190_000,

  // parking $/stall
  parkingPerStall: 31_700,       // structured (deck) stall
  parkingSurfacePerStall: 6_000, // surface stall (grading, paving, striping)

  // premium/club space uplift over the base rate, $/premium GSF
  premiumUpliftPerGSF: 250,

  // center-hung scoreboard tiers ($), separate from general technology
  scoreboardStandard: 15_000_000, scoreboardPremium: 28_000_000, scoreboardMarquee: 45_000_000,

  // LEED certification premium as % of hard cost
  leedSilverPct: 2, leedGoldPct: 5, leedPlatinumPct: 8,

  // site complexity → foundations/utilities lump ($)
  siteLow: 43_587_500, siteMedium: 59_437_500, siteHigh: 75_287_500,
};

// The editable rate table. RATES above is the default/reset baseline; the UI
// lifts a copy of it into hook state and passes it to computeModel so edits
// cascade through the whole model. Same shape as rates.
export type Rates = typeof RATES;

// ── 3. COMPONENT MODEL ───────────────────────────────────────────────────────
// Rate values flow in via the `rates` argument (defaults to RATES) so the UI can
// edit them live — the tier lookups below use whatever rate table is passed.
function techCost(tier: Inputs["techTier"], r: Rates) {
  return tier === "standard" ? r.techStandard
       : tier === "premium" ? r.techPremium : r.techFlagship;
}
function enclosureRate(tier: Inputs["facadeTier"], r: Rates) {
  return tier === "standard" ? r.enclosureStd
       : tier === "premium" ? r.enclosurePremium : r.enclosureSignature;
}
function siteCost(c: Inputs["siteComplexity"], r: Rates) {
  return c === "low" ? r.siteLow : c === "medium" ? r.siteMedium : r.siteHigh;
}
function scoreboardCost(t: Inputs["scoreboardTier"], r: Rates) {
  return t === "standard" ? r.scoreboardStandard
       : t === "premium" ? r.scoreboardPremium : r.scoreboardMarquee;
}
function leedPct(t: Inputs["leedTier"], r: Rates) {
  return t === "none" ? 0
       : t === "silver" ? r.leedSilverPct
       : t === "gold" ? r.leedGoldPct : r.leedPlatinumPct;
}

// Format a derived unit rate for the basis string: whole $ (with separators) for
// large per-unit rates, two decimals for small $/GSF-style rates.
function fmtRate(rate: number): string {
  return rate >= 1000
    ? Math.round(rate).toLocaleString()
    : (Math.round(rate * 100) / 100).toString();
}

// A trade component of a coarse parent line. weight = relative share (auto-
// normalized). qty/unit override the parent's driver for the takeoff display.
interface Comp {
  key: string;
  label: string;
  weight: number;
  qty?: number;
  unit?: string;
}

export function computeModel(input: Inputs, rates: Rates = RATES): ModelResult {
  const i = input;
  const items: LineItem[] = [];
  let parentSum = 0; // running sum of coarse parent costs, for the drift assertion

  // Single (non-subdivided) line — used for the markup/fee lines.
  const add = (key: string, label: string, group: LineItem["group"], cost: number, basis: string) =>
    items.push({ key, label, group, cost: Math.round(cost), basis });

  // Subdivide a coarse parent (computed with the SAME formula/rate as the legacy
  // aggregate line) into trade components. Component extended costs sum EXACTLY to
  // the rounded parent (the last component absorbs the rounding remainder), so the
  // division subtotals, hard cost and grand total are identical to before.
  const split = (
    parent: {
      key: string;
      label: string;
      group: LineItem["group"];
      cost: number;
      qty?: number;   // parent driver quantity (default for components)
      unit?: string;  // parent driver unit
      note?: string;  // basis text for lump components with no quantity
    },
    comps: Comp[],
  ) => {
    const parentCost = Math.round(parent.cost);
    parentSum += parentCost;
    const wsum = comps.reduce((s, c) => s + c.weight, 0);
    let allocated = 0;
    comps.forEach((c, idx) => {
      const last = idx === comps.length - 1;
      const cost = last ? parentCost - allocated : Math.round(parentCost * (c.weight / wsum));
      allocated += cost;
      const qty = c.qty ?? parent.qty;
      const unit = c.unit ?? parent.unit;
      const unitRate = qty && qty > 0 ? cost / qty : undefined;
      const basis =
        qty && unit && unitRate !== undefined
          ? `${Math.round(qty).toLocaleString()} ${unit} × $${fmtRate(unitRate)}`
          : parent.note ?? "allocated";
      items.push({ key: `${parent.key}.${c.key}`, label: c.label, group: parent.group, cost, basis, qty, unit, unitRate });
    });
  };

  // ── Site & Structure ──────────────────────────────────────────────────────
  split({ key: "site", label: "Site prep, utilities & foundations", group: "Site & Structure", cost: siteCost(i.siteComplexity, rates), qty: i.gsf, unit: "GSF" }, [
    { key: "demo", label: "Demolition & abatement", weight: 14 },
    { key: "earthwork", label: "Mass excavation & earthwork", weight: 22 },
    { key: "shoring", label: "Shoring & dewatering", weight: 12 },
    { key: "utilities", label: "Utility relocation & extension", weight: 20 },
    { key: "piles", label: "Deep foundations & drilled piers", weight: 32 },
  ]);
  split({ key: "structure", label: "Superstructure & long-span roof", group: "Site & Structure", cost: i.gsf * rates.superstructure, qty: i.gsf, unit: "GSF" }, [
    { key: "footings", label: "Footings & pile caps", weight: 15 },
    { key: "columns", label: "Columns & vertical framing", weight: 20 },
    { key: "floors", label: "Elevated floors & deck systems", weight: 24 },
    { key: "roof", label: "Long-span roof structure", weight: 31 },
    { key: "membrane", label: "Roof membrane & waterproofing", weight: 10 },
  ]);

  // ── Enclosure & Interiors ─────────────────────────────────────────────────
  split({ key: "enclosure", label: "Exterior enclosure / façade", group: "Enclosure & Interiors", cost: i.gsf * enclosureRate(i.facadeTier, rates), qty: i.gsf, unit: "GSF" }, [
    { key: "curtainwall", label: "Curtain wall & glazing", weight: 34 },
    { key: "metalpanel", label: "Metal panel & rainscreen", weight: 26 },
    { key: "precast", label: "Precast & architectural concrete", weight: 18 },
    { key: "entrances", label: "Entrances & storefronts", weight: 10 },
    { key: "feature", label: "Exterior signage & feature lighting", weight: 12 },
  ]);
  split({ key: "concourse", label: "Concourses, F&B & retail", group: "Enclosure & Interiors", cost: i.gsf * rates.concourseFnB, qty: i.gsf, unit: "GSF" }, [
    { key: "main", label: "Main concourse", weight: 32 },
    { key: "upper", label: "Upper concourse", weight: 22 },
    { key: "kitchens", label: "Kitchens & commissary", weight: 20 },
    { key: "concessions", label: "Concession stands", weight: 16 },
    { key: "retail", label: "Retail & team store", weight: 10 },
  ]);
  split({ key: "interiors", label: "Interior finishes", group: "Enclosure & Interiors", cost: i.gsf * rates.interiors, qty: i.gsf, unit: "GSF" }, [
    { key: "partitions", label: "Partitions & drywall", weight: 24 },
    { key: "flooring", label: "Flooring & tile", weight: 22 },
    { key: "ceilings", label: "Ceilings & acoustics", weight: 18 },
    { key: "doors", label: "Doors, frames & hardware", weight: 14 },
    { key: "finishes", label: "Paint, wall finishes & specialties", weight: 22 },
  ]);
  split({ key: "boh", label: "Back-of-house & team spaces", group: "Enclosure & Interiors", cost: rates.backOfHouse, qty: i.gsf, unit: "GSF" }, [
    { key: "locker", label: "Team & official locker rooms", weight: 26 },
    { key: "medical", label: "Sports medicine & hydrotherapy", weight: 16 },
    { key: "media", label: "Media & press facilities", weight: 16 },
    { key: "loading", label: "Loading dock & service areas", weight: 16 },
    { key: "ops", label: "Building operations, admin & storage", weight: 26 },
  ]);
  split({ key: "conveying", label: "Conveying systems", group: "Enclosure & Interiors", cost: rates.conveying, note: "vertical transportation allowance" }, [
    { key: "passenger", label: "Passenger elevators", weight: 30, qty: 8, unit: "units" },
    { key: "service", label: "Service & freight elevators", weight: 22, qty: 4, unit: "units" },
    { key: "escalators", label: "Escalators", weight: 34, qty: 12, unit: "units" },
    { key: "lifts", label: "Accessibility lifts", weight: 14, qty: 6, unit: "units" },
  ]);

  // ── Seating & Premium ─────────────────────────────────────────────────────
  split({ key: "bowl", label: "Seating bowl & fixed seating", group: "Seating & Premium", cost: i.seats * rates.seatingBowl, qty: i.seats, unit: "seat" }, [
    { key: "risers", label: "Bowl risers & structural seating", weight: 32 },
    { key: "seats", label: "Fixed seats & standards", weight: 28 },
    { key: "rails", label: "Guardrails, rails & vomitory finishes", weight: 16 },
    { key: "aisle", label: "Aisle lighting & step nosings", weight: 12 },
    { key: "accessible", label: "Accessible & companion seating", weight: 12 },
  ]);
  const premium = rates.premiumSpaces
    + (i.suites - 44) * rates.premiumPerSuite
    + (i.clubSeats - 2000) * rates.premiumPerClubSeat;
  split({ key: "premium", label: "Premium spaces (suites & clubs)", group: "Seating & Premium", cost: premium, note: "premium program allocation" }, [
    { key: "founders", label: "Founders / Home Plate Club", weight: 18, qty: 1, unit: "club" },
    { key: "bunker", label: "Bunker suites", weight: 14, qty: Math.max(1, Math.round(i.suites * 0.25)), unit: "suites" },
    { key: "loge", label: "Loge boxes", weight: 12, qty: Math.max(1, Math.round(i.suites * 1.2)), unit: "boxes" },
    { key: "club", label: "Club level & club seats", weight: 20, qty: i.clubSeats, unit: "club seats" },
    { key: "party", label: "Party & hospitality suites", weight: 10, qty: Math.max(1, Math.round(i.suites * 0.5)), unit: "suites" },
    { key: "fnb", label: "Premium F&B & club kitchens", weight: 14 },
    { key: "finishes", label: "Premium finishes & millwork", weight: 12 },
  ]);
  // Premium program size: premiumPct of GSF is premium/club space, carrying an
  // uplift over the base rate. Bigger premium program → materially higher cost.
  const premiumGSF = i.gsf * (i.premiumPct / 100);
  split({ key: "premuplift", label: "Premium & club space uplift", group: "Seating & Premium", cost: premiumGSF * rates.premiumUpliftPerGSF, qty: premiumGSF, unit: "prem. GSF" }, [
    { key: "fitout", label: "Premium fit-out & finishes uplift", weight: 60 },
    { key: "systems", label: "Club lounge & hospitality systems", weight: 40 },
  ]);

  // ── MEP & Fire  (ice capability increases MEP scope + adds a plant) ────────
  const iceAdder = i.iceCapable ? rates.iceCapability : 0;
  const mechComps: Comp[] = [
    { key: "plant", label: "Central heating & cooling plant", weight: 24 },
    { key: "ahu", label: "Air handling units", weight: 20 },
    { key: "duct", label: "Ductwork & air distribution", weight: 22 },
    { key: "plumb", label: "Plumbing & domestic water", weight: 18 },
    { key: "exhaust", label: "Special & kitchen exhaust", weight: 8 },
    { key: "controls", label: "BAS & HVAC controls", weight: 8 },
  ];
  if (i.iceCapable) {
    // Ice-plant portion inside mechanical — weighted so it captures the same
    // iceCapability*0.6 that the legacy aggregate mech line carried.
    mechComps.push({ key: "iceplant", label: "Ice plant & refrigeration (central)", weight: 100 * (iceAdder * 0.6) / (i.gsf * rates.mechPlumb) });
  }
  split({ key: "mech", label: "Mechanical & plumbing", group: "MEP & Fire", cost: i.gsf * rates.mechPlumb + iceAdder * 0.6, qty: i.gsf, unit: "GSF" }, mechComps);
  split({ key: "elec", label: "Electrical & lighting", group: "MEP & Fire", cost: i.gsf * rates.electrical, qty: i.gsf, unit: "GSF" }, [
    { key: "service", label: "Service, switchgear & distribution", weight: 26 },
    { key: "power", label: "Branch power & devices", weight: 20 },
    { key: "lighting", label: "Interior lighting", weight: 20 },
    { key: "sports", label: "Sports & event lighting", weight: 18 },
    { key: "standby", label: "Emergency & standby power", weight: 16 },
  ]);
  split({ key: "fire", label: "Fire protection", group: "MEP & Fire", cost: i.gsf * rates.fireProt, qty: i.gsf, unit: "GSF" }, [
    { key: "sprinkler", label: "Sprinklers & standpipe", weight: 60 },
    { key: "alarm", label: "Fire alarm & detection", weight: 28 },
    { key: "pump", label: "Fire pump & controls", weight: 12 },
  ]);
  if (i.iceCapable) {
    split({ key: "ice", label: "Ice capability systems", group: "MEP & Fire", cost: rates.iceCapability * 0.4 + 4_000_000, note: "NHL/AHL ice system" }, [
      { key: "floor", label: "Ice floor slab & piping", weight: 44 },
      { key: "dasher", label: "Dasher boards & glass", weight: 18 },
      { key: "dehumid", label: "Dehumidification & edge heating", weight: 38 },
    ]);
  }

  // ── Technology ────────────────────────────────────────────────────────────
  // Center-hung scoreboard is its own tier-driven line, separate from general tech.
  split({ key: "scoreboard", label: "Center-hung scoreboard", group: "Technology", cost: scoreboardCost(i.scoreboardTier, rates), note: `${i.scoreboardTier} tier` }, [
    { key: "display", label: "LED display & pixel system", weight: 75, qty: 1, unit: "assembly" },
    { key: "rigging", label: "Scoreboard rigging, hoist & control", weight: 25 },
  ]);
  split({ key: "tech", label: "AV, broadcast & event systems", group: "Technology", cost: techCost(i.techTier, rates), note: `${i.techTier} tier allocation` }, [
    { key: "broadcast", label: "Broadcast & production infrastructure", weight: 28 },
    { key: "das", label: "DAS, 5G & Wi-Fi", weight: 22 },
    { key: "iptv", label: "IPTV & digital displays", weight: 26 },
    { key: "sound", label: "Sound reinforcement", weight: 24 },
  ]);
  split({ key: "ribbon", label: "LED ribbon boards", group: "Technology", cost: i.ribbonBoards * rates.ribbonBoardEach, qty: i.ribbonBoards, unit: "boards" }, [
    { key: "primary", label: "Primary LED ribbon fascia", weight: 70 },
    { key: "aux", label: "Marquee & auxiliary LED", weight: 30 },
  ]);
  split({ key: "lowvolt", label: "Low-voltage, security & IT", group: "Technology", cost: i.gsf * rates.lowVoltSecurity, qty: i.gsf, unit: "GSF" }, [
    { key: "cabling", label: "Structured cabling & IT backbone", weight: 30 },
    { key: "security", label: "Security, surveillance & access control", weight: 30 },
    { key: "pa", label: "PA & mass notification", weight: 18 },
    { key: "pos", label: "Ticketing & POS network", weight: 22 },
  ]);

  // ── Parking & Site ────────────────────────────────────────────────────────
  // Structured vs. surface split: structured stalls are ~5x costlier than surface,
  // so this is a large lever. Default 100% structured keeps the original parking cost.
  const structuredStalls = Math.round(i.parkingStalls * (i.structuredParkingPct / 100));
  const surfaceStalls = i.parkingStalls - structuredStalls;
  if (structuredStalls > 0) {
    split({ key: "parking", label: "Parking structure", group: "Parking & Site", cost: structuredStalls * rates.parkingPerStall, qty: structuredStalls, unit: "structured stall" }, [
      { key: "deck", label: "Structured deck superstructure", weight: 46 },
      { key: "found", label: "Foundations & ramps", weight: 24 },
      { key: "mep", label: "Garage MEP & ventilation", weight: 18 },
      { key: "parcs", label: "PARCS, guidance & striping", weight: 12 },
    ]);
  }
  if (surfaceStalls > 0) {
    split({ key: "surface", label: "Surface parking & paving", group: "Parking & Site", cost: surfaceStalls * rates.parkingSurfacePerStall, qty: surfaceStalls, unit: "surface stall" }, [
      { key: "paving", label: "Grading, paving & striping", weight: 70 },
      { key: "drainage", label: "Site lighting & drainage", weight: 30 },
    ]);
  }
  split({ key: "sitedev", label: "Site development & public realm", group: "Parking & Site", cost: rates.siteDevelopment, qty: i.gsf, unit: "GSF" }, [
    { key: "hardscape", label: "Hardscape & entry plaza", weight: 30 },
    { key: "landscape", label: "Landscape & irrigation", weight: 22 },
    { key: "siteutil", label: "Site utilities & stormwater", weight: 26 },
    { key: "sitelight", label: "Site lighting & roadways", weight: 22 },
  ]);

  // Sustainability: LEED tier applies a premium on the base hard cost (all trade
  // lines above), added as its own breakdown line. Higher tier → higher premium.
  const leedPctVal = leedPct(i.leedTier, rates);
  if (leedPctVal > 0) {
    const baseHard = items.reduce((s, it) => s + it.cost, 0);
    const leedLabel = i.leedTier.charAt(0).toUpperCase() + i.leedTier.slice(1);
    split({ key: "leed", label: `LEED ${leedLabel} certification premium`, group: "MEP & Fire", cost: baseHard * (leedPctVal / 100), note: `${leedPctVal}% of hard cost` }, [
      { key: "envelope", label: "Enhanced envelope & commissioning", weight: 45 },
      { key: "systems", label: "High-efficiency systems & controls", weight: 35 },
      { key: "materials", label: "Sustainable materials & certification", weight: 20 },
    ]);
  }

  // GMP-style fee stack (GAP submitted rates), cascaded onto the Cost of Work.
  const MARKUPS: LineItem["group"] = "Fee, GCs & Markups (GAP submitted rates)";
  const hardCost = items.reduce((s, it) => s + it.cost, 0);       // Cost of Work

  // Guardrail: subdivided trade lines must sum to the same hard cost the coarse
  // parents defined — i.e. finer granularity, not a math change.
  console.assert(
    hardCost === parentSum,
    `[arenaCostModel] subdivision drift: line items sum $${hardCost.toLocaleString()} ≠ parent total $${parentSum.toLocaleString()}`,
  );
  const gcGr = hardCost * (i.gcGrPct / 100);                      // GCs on Cost of Work
  const afterGc = hardCost + gcGr;
  const fee = afterGc * (i.feePct / 100);                         // Contractor's Fee
  const afterFee = afterGc + fee;
  const contingency = afterFee * (i.contingencyPct / 100);        // Contingency at GMP
  const afterCont = afterFee + contingency;
  const preconFee = afterCont * (i.preconFeePct / 100);           // Preconstruction fee
  const afterPrecon = afterCont + preconFee;
  const bond = afterPrecon * (i.bondPct / 100);                   // P&P bond on contract value

  add("gcgr", `General conditions / GRs (${i.gcGrPct}%)`, MARKUPS, gcGr, "% of Cost of Work");
  add("fee", `Contractor's fee (${i.feePct}%)`, MARKUPS, fee, "% of Cost of Work + GCs");
  add("cont", `Construction contingency (${i.contingencyPct}%)`, MARKUPS, contingency, "% of subtotal (at GMP)");
  add("precon", `Preconstruction fee (${i.preconFeePct}%)`, MARKUPS, preconFee, "% of subtotal");
  add("bond", `P&P bond (${i.bondPct}%)`, MARKUPS, bond, "% of contract value");

  const constructionCostToday = afterPrecon + bond;
  const escalation = constructionCostToday * (i.escalationPct / 100);
  const constructionCostEscalated = constructionCostToday + escalation;

  return {
    items, hardCost, gcGr, fee, contingency, preconFee, bond,
    constructionCostToday, escalation, constructionCostEscalated,
    costPerSeat: constructionCostEscalated / i.seats,
  };
}

// ── 4. PHASING (for the animated site map / time view) ───────────────────────
// Maps component groups to a construction sequence across the build years.
// Each element carries a start→finish window; the site map animates cumulative
// spend and "under construction / complete" state by year.
// RFP milestones: Construction Start Feb 2028 · Substantial Completion Aug 2030 ·
// First Event Sept 2030. Preconstruction runs 2026–2028 ahead of the build. Trade
// sequence: Civil/Utilities → Structural → Garage → Architectural Exterior →
// Architectural Interior → Mechanical/Plumbing → Electrical → Low Voltage →
// Specialty → Commissioning, all inside the 2028–2030 window.
export const PHASE_PLAN: PhaseElement[] = [
  { key: "precon", label: "Preconstruction & design assist", startYear: 2026, endYear: 2028, zone: "precon" },
  { key: "civil", label: "Civil / utilities", startYear: 2028, endYear: 2028, zone: "civil" },
  { key: "structural", label: "Structural", startYear: 2028, endYear: 2029, zone: "structural" },
  { key: "garage", label: "Parking garage", startYear: 2028, endYear: 2029, zone: "garage" },
  { key: "archExterior", label: "Architectural exterior", startYear: 2029, endYear: 2030, zone: "archExterior" },
  { key: "archInterior", label: "Architectural interior", startYear: 2029, endYear: 2030, zone: "archInterior" },
  { key: "mechanical", label: "Mechanical / plumbing", startYear: 2029, endYear: 2030, zone: "mechanical" },
  { key: "electrical", label: "Electrical", startYear: 2029, endYear: 2030, zone: "electrical" },
  { key: "lowVoltage", label: "Low voltage", startYear: 2030, endYear: 2030, zone: "lowVoltage" },
  { key: "specialty", label: "Specialty construction", startYear: 2030, endYear: 2030, zone: "specialty" },
  { key: "commissioning", label: "Commissioning & first event", startYear: 2030, endYear: 2030, zone: "commissioning" },
];

// Given the model + phase plan, distribute each item's cost across its years
// (straight-line) and return per-year and cumulative spend for the timeline.
export function computePhasing(model: ModelResult, escalate = true): Phasing {
  // group item costs into the RFP trade-sequence phase keys (some map many→one)
  const groupToPhase: Record<string, string> = {
    site: "civil", structure: "structural", enclosure: "archExterior", concourse: "archInterior",
    interiors: "archInterior", boh: "archInterior", conveying: "specialty", bowl: "structural",
    premium: "archInterior", premuplift: "archInterior", mech: "mechanical", elec: "electrical", fire: "mechanical",
    ice: "mechanical", leed: "mechanical", tech: "lowVoltage", scoreboard: "lowVoltage",
    ribbon: "lowVoltage", lowvolt: "lowVoltage",
    parking: "garage", surface: "civil", sitedev: "civil",
    gcgr: "spread", fee: "spread", cont: "spread", precon: "spread", bond: "spread",
  };
  const escFactor = escalate ? model.constructionCostEscalated / model.constructionCostToday : 1;
  const years = Array.from({ length: 2030 - 2026 + 1 }, (_, k) => 2026 + k);
  const perYear: Record<number, number> = Object.fromEntries(years.map(y => [y, 0]));

  for (const it of model.items) {
    // Line item keys are compound ("mech.duct"); map by the parent key prefix.
    const baseKey = it.key.split(".")[0];
    const phaseKey = groupToPhase[baseKey] || "archInterior";
    const cost = it.cost * escFactor;
    if (phaseKey === "spread") {
      // markups spread across full program
      years.forEach(y => (perYear[y] += cost / years.length));
      continue;
    }
    const ph = PHASE_PLAN.find(p => p.key === phaseKey)!;
    const span = ph.endYear - ph.startYear + 1;
    for (let y = ph.startYear; y <= ph.endYear; y++) perYear[y] += cost / span;
  }
  let cum = 0;
  return years.map(y => ({ year: y, spend: perYear[y], cumulative: (cum += perYear[y]) }));
}

// ── 5. STAFFING (Phase 2 seam) ───────────────────────────────────────────────
// Wired path for the future manpower/staffing feature so the UI can already
// reference a real export. Intentionally a stub — do NOT build out here.
export function computeStaffing(model: ModelResult) {
  void model;
  return { note: "Phase 2" };
}
