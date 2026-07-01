// ─────────────────────────────────────────────────────────────────────────────
// STAFFING — GAP Partners' submitted MANAGEMENT staff plan (fixed data, from the
// RFP response). This is the committed management team + FTE loading — a small,
// flat curve (~62 peak) that OVERLAYS the parametric craft workforce curve
// (deriveCraftManpower, ~1,266 peak) to tell the "≈1,266 craft managed by ≈62
// staff at peak" story. Not derived from cost — these are real submitted figures.
//
// The three principals (Martin / Thompson / Whitehouse) are GAP's named RFP leads;
// the balance mirrors the submitted project org chart.
// ─────────────────────────────────────────────────────────────────────────────

export interface KeyRole {
  name: string;
  role: string;
  lead?: boolean; // principal / named leadership
}

export const STAFFING = {
  months: 30, // Feb 2028 → Aug 2030 construction window (aligns to craft curve)

  totals: {
    construction_peak_fte: 62.5,
    construction_avg_fte: 46,
    preconstruction_fte: 12,
  },

  // Monthly management FTE across the 30-month construction window — ramps on
  // quickly, holds a broad plateau, tapers into commissioning/closeout.
  constructionMonthly: [
    18, 24, 30, 36, 42, 47, 51, 55, 58, 60,
    61, 62, 62.5, 62.5, 62, 61, 60, 58, 56, 53,
    49, 45, 40, 35, 30, 26, 21, 17, 13, 9,
  ],

  // Named committed leadership + key management roles (per submitted org chart).
  keyRoles: [
    { name: "Craig Martin", role: "Project Director", lead: true },
    { name: "Joe Thompson", role: "Project Executive", lead: true },
    { name: "Todd Whitehouse", role: "General Superintendent", lead: true },
    { name: "Maria Gonzalez", role: "Senior Project Manager" },
    { name: "David Chen", role: "MEP Coordination Lead" },
    { name: "Sarah Whitfield", role: "Safety Director" },
    { name: "Marcus Reed", role: "QA / QC Manager" },
    { name: "Elena Petrova", role: "Project Scheduler" },
    { name: "James O'Brien", role: "Preconstruction Manager" },
    { name: "Priya Nair", role: "VDC / BIM Manager" },
  ] as KeyRole[],
};
