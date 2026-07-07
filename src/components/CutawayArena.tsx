// ─────────────────────────────────────────────────────────────────────────────
// CUTAWAY ISOMETRIC ARENA — visual geometry only.
// All timing lives in SiteTimeline: this component receives the same per-phase
// fade values (0→1) the previous inline SVG used, exposed as <g id="phase-…">
// groups whose opacity is driven directly by those fades. Phase keys match the
// PHASES array in SiteTimeline: foundations, parking, structure, lowerBowl,
// upperBowl, facade, roof, eventFloor, commissioning (+ the two crane fades).
//
// Projection: horizontal circles render as ellipses with ry = 0.5·rx around
// C = (560, 430); elevation z shifts a point UP by z px. Point on a ring:
// (cx + r·cosθ, cy + 0.5·r·sinθ − z), θ = 0 at right, clockwise (SVG y-down),
// so the FRONT is θ ≈ 90°. The front wedge θ ∈ [45°, 135°] is cut away from
// every ring; each ring is a 270° arc from 135° through the back to 405°, and
// vertical SECTION FACES close the cut planes in the darkened tone.
// ─────────────────────────────────────────────────────────────────────────────

export interface CutawayFades {
  found: number;
  park: number;
  struct: number;
  lower: number;
  upper: number;
  facade: number;
  roof: number;
  floor: number;
  comm: number;
  crane1: number;
  crane2: number;
}

type Pt = [number, number];

// ── Projection + arc helpers ─────────────────────────────────────────────────
const CX = 560, CY = 430;      // arena center
const A0 = 135, A1 = 405;      // kept arc (front wedge 45°–135° removed)
const CUT_A = 45, CUT_B = 135; // cut-plane angles
const RAD = Math.PI / 180;

const isoPoint = (r: number, deg: number, z: number): Pt => [
  CX + r * Math.cos(deg * RAD),
  CY + 0.5 * r * Math.sin(deg * RAD) - z,
];
const P = isoPoint;
const fmt = (p: Pt) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
const poly = (pts: Pt[]) => pts.map(fmt).join(" ");
const arc = (r: number, z: number, a0 = A0, a1 = A1, n = 48): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) out.push(P(r, a0 + ((a1 - a0) * i) / n, z));
  return out;
};
const arcPath = (r: number, z: number, a0 = A0, a1 = A1, n = 48) =>
  `M ${arc(r, z, a0, a1, n).map(fmt).join(" L ")}`;
// Flat annular band (tread / concourse) at one elevation.
const ringBand = (rIn: number, rOut: number, z: number, a0 = A0, a1 = A1, n = 48) =>
  `M ${arc(rOut, z, a0, a1, n).map(fmt).join(" L ")} L ${arc(rIn, z, a0, a1, n)
    .reverse().map(fmt).join(" L ")} Z`;
// Vertical cylindrical band (riser / curtain wall): same r, two elevations.
const wallBand = (r: number, zLo: number, zHi: number, a0 = A0, a1 = A1, n = 48) =>
  `M ${arc(r, zHi, a0, a1, n).map(fmt).join(" L ")} L ${arc(r, zLo, a0, a1, n)
    .reverse().map(fmt).join(" L ")} Z`;
// Sloped band between two rings at different r AND z (roof shell).
const slopeBand = (rOut: number, zOut: number, rIn: number, zIn: number, n = 56) =>
  `M ${arc(rOut, zOut, A0, A1, n).map(fmt).join(" L ")} L ${arc(rIn, zIn, A0, A1, n)
    .reverse().map(fmt).join(" L ")} Z`;
// Vertical section quad on a cut plane: r range × z range at fixed θ.
const sectionFace = (rIn: number, rOut: number, zLo: number, zHi: number, deg: number) =>
  poly([P(rIn, deg, zLo), P(rOut, deg, zLo), P(rOut, deg, zHi), P(rIn, deg, zHi)]);
const lerp = (a: Pt, b: Pt, f: number): Pt => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];

// Small iso box from a plan rectangle (px,py = plan center rel. C, half extents
// w×d, rotated rotDeg in plan) from z0 up h. Returns top + two visible faces.
const isoBoxAt = (px: number, py: number, w: number, d: number, rotDeg: number, z0: number, h: number) => {
  const a = rotDeg * RAD, ca = Math.cos(a), sa = Math.sin(a);
  const cs: Pt[] = ([[w, d], [w, -d], [-w, -d], [-w, d]] as Pt[])
    .map(([u, v]) => [px + u * ca - v * sa, py + u * sa + v * ca] as Pt);
  const S = (p: Pt, z: number): Pt => [CX + p[0], CY + p[1] * 0.5 - z];
  let fi = 0;
  cs.forEach((p, i) => { if (p[1] > cs[fi][1]) fi = i; });
  const F = cs[fi], n1 = cs[(fi + 1) % 4], n2 = cs[(fi + 3) % 4];
  const L = n1[0] < n2[0] ? n1 : n2, R = n1[0] < n2[0] ? n2 : n1;
  return {
    top: poly(cs.map((p) => S(p, z0 + h))),
    left: poly([S(L, z0 + h), S(F, z0 + h), S(F, z0), S(L, z0)]),
    right: poly([S(F, z0 + h), S(R, z0 + h), S(R, z0), S(F, z0)]),
  };
};

// ── Lighting tones (single source upper-left) ────────────────────────────────
// TOP = base +15% light · RIGHT/outer = base · CUT/section = base −25%.
const T = {
  found:  { top: "#B4B8BD", base: "#9AA0A6", cut: "#73787D" },
  park:   { top: "#6C78BE", base: "#4E5BA8", cut: "#3A447E" },
  struct: { top: "#33C2BA", base: "#00B0A8", cut: "#00847E" },
  lower:  { top: "#F4AC91", base: "#F0997B", cut: "#B4735C" },
  suite:  { top: "#EE93BE", base: "#E86FA9", cut: "#AE547F" },
  upper:  { top: "#F79A46", base: "#F5821F", cut: "#B86217" },
  glass:  { top: "#2E96A8", base: "#1B7A8C", cut: "#0A2E36" },
  canopy: { top: "#F4A44B", base: "#F08C1E", cut: "#B4690F" },
  roof:   { top: "#A968FC", base: "#9643FC", cut: "#6E32BD" },
  conc:   { top: "#D6D9DC", base: "#C7CBCF", cut: "#969A9E" },
  green:  { hi: "#7FAF78", lo: "#4C7D52" },
};
const MUTED = "#6B6E73";
const GHOST_FILL = "#EDEFF2", GHOST_STROKE = "#D8DBDE";

// ── Key dimensions (refinement passes touch only these) ─────────────────────
const R_FLOOR = 120;
const LOWER_R0 = 140, LOWER_R1 = 300, LOWER_Z0 = 0, LOWER_Z1 = 70, LOWER_N = 6;
const CONC_R0 = 300, CONC_R1 = 345, CONC_Z = 70;
const SUITE_R0 = 305, SUITE_R1 = 335, SUITE_Z0 = 70, SUITE_Z1 = 95;
const UPPER_R0 = 310, UPPER_R1 = 425, UPPER_Z0 = 95, UPPER_Z1 = 185, UPPER_N = 7;
const R_WALL = 455, Z_WALL = 205;
const ROOF_RO = 470, ROOF_ZO = 215, ROOF_RI = 300, ROOF_ZI = 245;
const BAY_A0 = 145, BAY_A1 = 160, BAY_ZTOP = 180;
const CANOPY_ATTACH = 0.6, CANOPY_D = 70, CANOPY_PITCH = 5, CANOPY_FASCIA = 6;
const R_PLAZA = 520, R_FND_IN = 430, R_FND_OUT = 455;

// ── FOUNDATIONS ──────────────────────────────────────────────────────────────
const FND = {
  boundary: "36,470 320,196 830,168 1168,372 1152,652 660,742 210,706",
  ring: ringBand(R_FND_IN, R_FND_OUT, 0, CUT_A, CUT_B, 24),
};

// ── PARKING GARAGE (plan center rel. C, rotated 15°) ─────────────────────────
const GAR = (() => {
  const cx = 538, cy = 180, w = 65, d = 130, rot = 15, h = 54;
  const box = isoBoxAt(cx, cy, w, d, rot, 0, h);
  const a = rot * RAD, ua: Pt = [Math.cos(a), Math.sin(a)], ub: Pt = [-Math.sin(a), Math.cos(a)];
  const S = (p: Pt, z: number): Pt => [CX + p[0], CY + p[1] * 0.5 - z];
  const corner = (su: number, sv: number): Pt =>
    [cx + su * w * ua[0] + sv * d * ub[0], cy + su * w * ua[1] + sv * d * ub[1]];
  const pA = corner(1, 1), pB = corner(1, -1), pD = corner(-1, 1); // front / right / left
  const levels: [Pt, Pt][] = [];
  [18, 36].forEach((z) => {
    levels.push([S(pD, z), S(pA, z)]);
    levels.push([S(pA, z), S(pB, z)]);
  });
  // parked-car dashes on the roof level along the long axis
  const cars: [Pt, Pt][] = [-100, -60, -20, 20, 60, 100].map((di) => {
    const p: Pt = [cx - 20 * ua[0] + di * ub[0], cy - 20 * ua[1] + di * ub[1]];
    const dx = ua[0] * 9, dy = ua[1] * 9;
    return [S([p[0] - dx, p[1] - dy], h), S([p[0] + dx, p[1] + dy], h)];
  });
  const rampC = S([pA[0] - 14 * ua[0], pA[1] - 14 * ua[1]], 0);
  return { ...box, levels, cars, rampC, frontBase: S(pA, 0) };
})();

// ── STRUCTURE (event floor, court, BOH, tunnel, struts) ──────────────────────
const COURT = (() => {
  const a = 18 * RAD, ux: Pt = [Math.cos(a), Math.sin(a)], uy: Pt = [-Math.sin(a), Math.cos(a)];
  const c = (su: number, sv: number): Pt => {
    const px = su * 86 * ux[0] + sv * 46 * uy[0], py = su * 86 * ux[1] + sv * 46 * uy[1];
    return [CX + px, CY + py * 0.5];
  };
  const mid = (p: Pt, q: Pt): Pt => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const c1 = c(1, 1), c2 = c(1, -1), c3 = c(-1, -1), c4 = c(-1, 1);
  return { quad: poly([c1, c2, c3, c4]), hoopA: mid(c1, c2), hoopB: mid(c3, c4) };
})();
const BOH = [
  { box: isoBoxAt(205 * Math.cos(72 * RAD), 205 * Math.sin(72 * RAD), 15, 10, 12, 0, 14), label: "Visitor locker", lx: 664, ly: 556 },
  { box: isoBoxAt(0, 215, 15, 10, 0, 0, 14), label: "", lx: 0, ly: 0 },
  { box: isoBoxAt(205 * Math.cos(108 * RAD), 205 * Math.sin(108 * RAD), 15, 10, -12, 0, 14), label: "Home locker", lx: 452, ly: 556 },
];
const TUNNEL = { quad: "548,490 572,490 572,575 548,575", line: [560, 492, 560, 573] as const };
const STRUTS: [Pt, Pt][] = [160, 185, 210, 235, 260, 285, 310, 335, 360]
  .map((a) => [P(435, a, CONC_Z), P(435, a, Z_WALL)] as [Pt, Pt]);

// ── SEATING BOWLS (stepped rings + per-step section quads on both cut planes) ─
interface Step { riser: string; tread: string; cutA: string; cutB: string }
const bowlSteps = (rIn: number, rOut: number, zLo: number, zHi: number, n: number): Step[] => {
  const dr = (rOut - rIn) / n, dz = (zHi - zLo) / n, out: Step[] = [];
  for (let k = 1; k <= n; k++) {
    const r0 = rIn + dr * (k - 1), r1 = rIn + dr * k;
    const z0 = zLo + dz * (k - 1), z1 = zLo + dz * k;
    out.push({
      riser: wallBand(r0, z0, z1),
      tread: ringBand(r0, r1, z1),
      cutA: sectionFace(r0, r1, z0, z1, CUT_A),
      cutB: sectionFace(r0, r1, z0, z1, CUT_B),
    });
  }
  return out;
};
const LOWER = bowlSteps(LOWER_R0, LOWER_R1, LOWER_Z0, LOWER_Z1, LOWER_N);
const UPPER = bowlSteps(UPPER_R0, UPPER_R1, UPPER_Z0, UPPER_Z1, UPPER_N);
const LOWER_AISLES: [Pt, Pt][] = [150, 180, 210, 240, 270, 300, 330, 360, 390]
  .map((a) => [P(LOWER_R0, a, 12), P(LOWER_R1, a, LOWER_Z1)] as [Pt, Pt]);
const UPPER_AISLES: [Pt, Pt][] = [180, 225, 270, 315, 360]
  .map((a) => [P(UPPER_R0, a, 108), P(UPPER_R1, a, UPPER_Z1)] as [Pt, Pt]);
const SUITE = {
  riser: wallBand(SUITE_R0, SUITE_Z0, SUITE_Z1),
  tread: ringBand(SUITE_R0, SUITE_R1, SUITE_Z1),
  cutA: sectionFace(SUITE_R0, SUITE_R1, SUITE_Z0, SUITE_Z1, CUT_A),
  cutB: sectionFace(SUITE_R0, SUITE_R1, SUITE_Z0, SUITE_Z1, CUT_B),
  ticks: [139, 142, 145, 148, 392, 395, 398, 401].map((a) => P(320, a, 90)),
};

// ── CONCOURSE (rendered early for correct occlusion; fades with eventFloor) ──
const CONC = {
  ring: ringBand(CONC_R0, CONC_R1, CONC_Z),
  cutA: sectionFace(CONC_R0, CONC_R1, CONC_Z - 12, CONC_Z, CUT_A),
  cutB: sectionFace(CONC_R0, CONC_R1, CONC_Z - 12, CONC_Z, CUT_B),
};

// ── FAÇADE (curtain wall + feature entry bay) ────────────────────────────────
const WALL = {
  band: wallBand(R_WALL, 0, Z_WALL),
  mullions: Array.from({ length: 19 }, (_, k) => {
    const a = A0 + 13.5 * (k + 1);
    return [P(R_WALL, a, 0), P(R_WALL, a, Z_WALL)] as [Pt, Pt];
  }),
  spandrels: [arcPath(R_WALL, 70), arcPath(R_WALL, 140)],
  rim: arcPath(R_WALL, Z_WALL),
  reflection: poly([P(R_WALL, 196, 0), P(R_WALL, 214, Z_WALL), P(R_WALL, 220, Z_WALL), P(R_WALL, 202, 0)]),
  cutA: sectionFace(R_WALL - 10, R_WALL, 0, Z_WALL, CUT_A),
  cutB: sectionFace(R_WALL - 10, R_WALL, 0, Z_WALL, CUT_B),
};
const BAY = (() => {
  const b1 = P(R_WALL, BAY_A0, 0), b2 = P(R_WALL, BAY_A1, 0);
  const t1 = P(R_WALL, BAY_A0, BAY_ZTOP), t2 = P(R_WALL, BAY_A1, BAY_ZTOP);
  return {
    quad: poly([b1, b2, t2, t1]),
    mullions: [148.75, 152.5, 156.25].map((a) => [P(R_WALL, a, 0), P(R_WALL, a, BAY_ZTOP)] as [Pt, Pt]),
    spandrel: [P(R_WALL, BAY_A0, 90), P(R_WALL, BAY_A1, 90)] as [Pt, Pt],
    doors: [0.33, 0.67].map((f) => lerp(b1, b2, f)),
    fin: [P(R_WALL, BAY_A0, 0), P(R_WALL, BAY_A0, 185)] as [Pt, Pt],
    reflection: poly([[178, 530], [140, 420], [146, 414], [184, 522]] as Pt[]),
    b1, b2, t1, t2,
  };
})();

// ── FEATURE CANOPY — inner edge derived on the bay's vertical edge lines at
// 60% height (zero gap to glass); outer edge projected 70 px outward in plan,
// dropped CANOPY_PITCH px (slight pitch); 3 pure-vertical columns to plaza. ──
const CANOPY = (() => {
  const zA = BAY_ZTOP * CANOPY_ATTACH; // attachment height on the bay edges
  const I1 = P(R_WALL, BAY_A0, zA), I2 = P(R_WALL, BAY_A1, zA);
  const out = (p: Pt, deg: number): Pt => [
    p[0] + Math.cos(deg * RAD) * CANOPY_D,
    p[1] + 0.5 * Math.sin(deg * RAD) * CANOPY_D + CANOPY_PITCH,
  ];
  const O1 = out(I1, BAY_A0), O2 = out(I2, BAY_A1);
  const dn = (p: Pt): Pt => [p[0], p[1] + CANOPY_FASCIA];
  // plaza ground line under the outer edge (same plan points at z = 0)
  const g1: Pt = [O1[0], CY + 0.5 * (R_WALL + CANOPY_D) * Math.sin(BAY_A0 * RAD)];
  const g2: Pt = [O2[0], CY + 0.5 * (R_WALL + CANOPY_D) * Math.sin(BAY_A1 * RAD)];
  const cols = [0.15, 0.5, 0.85].map((f) => {
    const top = dn(lerp(O1, O2, f)), base = lerp(g1, g2, f);
    return [top, [top[0], base[1]]] as [Pt, Pt]; // pure vertical drop
  });
  return {
    blade: poly([I1, I2, O2, O1]),
    fasciaOuter: poly([O1, O2, dn(O2), dn(O1)]),
    fasciaS1: poly([I1, O1, dn(O1), dn(I1)]),
    fasciaS2: poly([I2, O2, dn(O2), dn(I2)]),
    cols,
    shadow: { cx: (O1[0] + O2[0]) / 2, cy: (g1[1] + g2[1]) / 2 + 2 },
  };
})();

// ── ROOF ─────────────────────────────────────────────────────────────────────
const ROOFC = {
  band: slopeBand(ROOF_RO, ROOF_ZO, ROOF_RI, ROOF_ZI),
  innerEdge: arcPath(ROOF_RI, ROOF_ZI),
  rim: arcPath(ROOF_RO, ROOF_ZO),
  truss: [160, 200, 240, 300, 340, 380] // back 270° only; θ=270 skipped (exits canvas)
    .map((a) => [P(ROOF_RI, a, ROOF_ZI), P(ROOF_RO, a, ROOF_ZO)] as [Pt, Pt]),
  ring: arcPath(130, 250, 180, 360, 32),
  cutA: poly([P(ROOF_RI, CUT_A, ROOF_ZI), P(ROOF_RO, CUT_A, ROOF_ZO), P(ROOF_RO, CUT_A, ROOF_ZO - 8), P(ROOF_RI, CUT_A, ROOF_ZI - 8)]),
  cutB: poly([P(ROOF_RI, CUT_B, ROOF_ZI), P(ROOF_RO, CUT_B, ROOF_ZO), P(ROOF_RO, CUT_B, ROOF_ZO - 8), P(ROOF_RI, CUT_B, ROOF_ZI - 8)]),
  mech: [
    isoBoxAt(390 * Math.cos(250 * RAD), 390 * Math.sin(250 * RAD), 11, 7, 10, 229, 10),
    isoBoxAt(390 * Math.cos(292 * RAD), 390 * Math.sin(292 * RAD), 11, 7, -10, 229, 10),
  ],
};

// ── FIT-OUT landscape ────────────────────────────────────────────────────────
const TREES: [number, number, number][] = [
  [150, 340, 6], [196, 308, 5], [238, 356, 7], [118, 392, 5], // back-left cluster
  [498, 666, 6], [556, 684, 7], [618, 668, 5],                 // front-center cluster
  [700, 622, 6], [762, 652, 7], [812, 638, 5],                 // right, near garage path
];
const POLES: Pt[] = [[356, 606], [214, 556], [908, 516], [686, 660]];
const PEOPLE_FITOUT: Pt[] = [[416, 585], [423, 588], [724, 590], [731, 593]];
const PEOPLE_ENTRY: Pt[] = [[206, 572], [213, 575], [232, 588], [239, 591]];

// ── Tower cranes (same fade behavior as before) ──────────────────────────────
interface Crane { base: Pt; mastTop: Pt; apex: Pt; jibTip: Pt; cjTip: Pt; hookTop: Pt; hookBot: Pt }
const CR1: Crane = {
  base: [600, 442], mastTop: [600, 148], apex: [600, 120],
  jibTip: [772, 148], cjTip: [524, 148], hookTop: [716, 148], hookBot: [716, 300],
};
const CR2: Crane = {
  base: [980, 600], mastTop: [980, 410], apex: [980, 392],
  jibTip: [1090, 410], cjTip: [912, 410], hookTop: [1058, 410], hookBot: [1058, 500],
};
function CraneRig({ c, o, big }: { c: Crane; o: number; big: boolean }) {
  const mast = big ? 2.4 : 1.8, arm = big ? 2.4 : 1.8, thin = big ? 1.1 : 0.9;
  const L = (a: Pt, b: Pt, w: number, key: string) => (
    <line key={key} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={w} />
  );
  if (o <= 0.001) return null;
  return (
    <g opacity={o} stroke="#44443F" fill="none" strokeLinecap="round">
      {L(c.base, c.mastTop, mast, "mast")}
      {L(c.mastTop, c.apex, thin, "apex")}
      {L(c.mastTop, c.jibTip, arm, "jib")}
      {L(c.mastTop, c.cjTip, arm, "cj")}
      {L(c.apex, c.jibTip, thin, "tie1")}
      {L(c.apex, c.cjTip, thin, "tie2")}
      {L(c.hookTop, c.hookBot, thin, "hook")}
      <rect x={c.hookBot[0] - 3} y={c.hookBot[1] - 3} width={6} height={6} fill="#44443F" stroke="none" />
    </g>
  );
}

const ln = (l: [Pt, Pt] | readonly [Pt, Pt], key: string, stroke: string, w: number, o = 1, dash?: string) => (
  <line key={key} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]}
    stroke={stroke} strokeWidth={w} opacity={o} strokeDasharray={dash} strokeLinecap="round" />
);

// ─────────────────────────────────────────────────────────────────────────────
export default function CutawayArena({ f }: { f: CutawayFades }) {
  return (
    <svg viewBox="0 0 1200 780" width="100%" role="img"
      aria-label="Cutaway isometric arena assembling by construction phase">
      <defs>
        <linearGradient id="ctw-glass" x1="0" y1="-5" x2="0" y2="660" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#1B7A8C" />
          <stop offset="1" stopColor="#0A3E4A" />
        </linearGradient>
        <linearGradient id="ctw-entry" x1="0" y1="328" x2="0" y2="560" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#55B9CC" />
          <stop offset="1" stopColor="#1B7A8C" />
        </linearGradient>
        <linearGradient id="ctw-roof" x1="0" y1="-20" x2="0" y2="470" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#A968FC" />
          <stop offset="1" stopColor="#7A2FD8" />
        </linearGradient>
        <radialGradient id="ctw-shadow">
          <stop offset="0" stopColor="#000" stopOpacity="0.14" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={0} y={0} width={1200} height={780} rx={20} fill="#F6F7F8" />

      {/* Ghost plaza — faint preview while scrubbing */}
      <ellipse cx={CX} cy={CY} rx={R_PLAZA} ry={R_PLAZA / 2} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={1} />

      {/* ── FOUNDATIONS & SITE ── */}
      <g id="phase-foundations" opacity={f.found}>
        <ellipse cx={CX} cy={CY} rx={R_PLAZA} ry={R_PLAZA / 2} fill="#EFEBE2" stroke="#DCD6CB" strokeWidth={1} />
        <polygon points={FND.boundary} fill="none" stroke="#B9BDC2" strokeWidth={1.5} strokeDasharray="9 7" />
        <ellipse cx={CX} cy={CY + 12} rx={470} ry={235} fill="url(#ctw-shadow)" />
        <path d={FND.ring} fill={T.found.base} stroke={T.found.cut} strokeWidth={0.75} />
      </g>

      {/* Ghost massing silhouettes — above the plaza so they stay visible early */}
      <path d={WALL.band} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={1} />
      <path d={ROOFC.band} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={1} />
      <polygon points={GAR.top} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={1} />

      {/* ── COMMISSIONING — dashed plaza-level ring; drawn early so the arena
             mass hides its back half (it only reads on the open plaza) ── */}
      <g id="phase-commissioning" opacity={f.comm}>
        <ellipse cx={CX} cy={CY} rx={530} ry={265} fill="none" stroke="#639922" strokeWidth={1.5} strokeDasharray="7 6" />
      </g>

      {/* ── PARKING GARAGE ── */}
      <g id="phase-parking" opacity={f.park}>
        <ellipse cx={1098} cy={545} rx={105} ry={30} fill="#000" opacity={0.06} />
        <polygon points={GAR.left} fill={T.park.cut} />
        <polygon points={GAR.right} fill={T.park.base} />
        <polygon points={GAR.top} fill={T.park.top} />
        {GAR.levels.map((l, i) => ln(l, `gl${i}`, "#fff", 1, 0.85))}
        {GAR.cars.map((l, i) => ln(l, `gc${i}`, i % 2 ? "#D8DEF0" : "#fff", 4, 0.95))}
        <ellipse cx={GAR.rampC[0]} cy={GAR.rampC[1] - 4} rx={15} ry={7.5} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.9} />
        <ellipse cx={GAR.rampC[0]} cy={GAR.rampC[1] - 4} rx={7.5} ry={3.75} fill="none" stroke="#fff" strokeWidth={1.2} opacity={0.9} />
      </g>

      {/* ── FAÇADE: curtain wall + feature entry bay (canopy rendered above the
             bowls, further down, in its own façade-fade group) ── */}
      <g id="phase-facade" opacity={f.facade}>
        <path d={WALL.band} fill="url(#ctw-glass)" />
        {WALL.mullions.map((l, i) => ln(l, `wm${i}`, "#A5E6F0", 1.2, 0.45))}
        <path d={WALL.spandrels[0]} fill="none" stroke="#A5E6F0" strokeWidth={1} opacity={0.25} />
        <path d={WALL.spandrels[1]} fill="none" stroke="#A5E6F0" strokeWidth={1} opacity={0.25} />
        <path d={WALL.rim} fill="none" stroke="#BFEDF5" strokeWidth={1.5} opacity={0.8} />
        <polygon points={WALL.reflection} fill="#fff" opacity={0.05} />
        <polygon points={WALL.cutA} fill={T.glass.cut} stroke="#061F25" strokeWidth={1} />
        <polygon points={WALL.cutB} fill={T.glass.cut} stroke="#061F25" strokeWidth={1} />
        {/* feature entry bay */}
        <polygon points={BAY.quad} fill="url(#ctw-entry)" stroke="#0F5666" strokeWidth={0.75} />
        {BAY.mullions.map((l, i) => ln(l, `bm${i}`, "#CFF2F8", 1, 0.55))}
        {ln(BAY.spandrel, "bsp", "#CFF2F8", 1, 0.45)}
        {BAY.doors.map((p, i) => (
          <rect key={`bd${i}`} x={p[0] - 4.5} y={p[1] - 24} width={9} height={24} fill="#0A2E36" />
        ))}
        {ln(BAY.fin, "bfin", "#EC008C", 3.5)}
        <polygon points={BAY.reflection} fill="#fff" opacity={0.12} />
      </g>

      {/* ── STRUCTURE: event floor, court, BOH, service tunnel, roof struts ── */}
      <g id="phase-structure" opacity={f.struct}>
        {STRUTS.map((l, i) => ln(l, `st${i}`, "#90A4AA", 1.2, 0.55))}
        <ellipse cx={CX} cy={CY} rx={R_FLOOR} ry={R_FLOOR / 2} fill={T.struct.top} stroke={T.struct.cut} strokeWidth={2} />
        <polygon points={COURT.quad} fill="#D9A968" stroke="#fff" strokeWidth={0.75} />
        <ellipse cx={CX} cy={CY} rx={11} ry={5.5} fill="none" stroke="#fff" strokeWidth={1} />
        <circle cx={COURT.hoopA[0]} cy={COURT.hoopA[1]} r={2.5} fill="#E8542F" />
        <circle cx={COURT.hoopB[0]} cy={COURT.hoopB[1]} r={2.5} fill="#E8542F" />
        {BOH.map((b, i) => (
          <g key={`boh${i}`}>
            <polygon points={b.box.left} fill="#6FA19D" />
            <polygon points={b.box.right} fill="#86B7B3" />
            <polygon points={b.box.top} fill="#9ECBC7" />
          </g>
        ))}
        <polygon points={TUNNEL.quad} fill="#C2C7CB" stroke="#9DA2A6" strokeWidth={0.75} />
        <line x1={TUNNEL.line[0]} y1={TUNNEL.line[1]} x2={TUNNEL.line[2]} y2={TUNNEL.line[3]}
          stroke={MUTED} strokeWidth={1} strokeDasharray="4 4" />
        <text x={452} y={556} textAnchor="middle" fontSize={11} fill={MUTED}>Home locker</text>
        <text x={664} y={556} textAnchor="middle" fontSize={11} fill={MUTED}>Visitor locker</text>
        <text x={560} y={600} textAnchor="middle" fontSize={11} fill={MUTED}>Service tunnel</text>
      </g>

      {/* Main concourse — fades with eventFloor, drawn before the bowls so the
          suite riser correctly occludes its outer back edge */}
      <g id="phase-eventFloor-concourse" opacity={f.floor}>
        <path d={CONC.ring} fill={T.conc.top} stroke="#B9BDC1" strokeWidth={0.5} />
        <polygon points={CONC.cutA} fill={T.conc.cut} stroke="#7E8286" strokeWidth={0.75} />
        <polygon points={CONC.cutB} fill={T.conc.cut} stroke="#7E8286" strokeWidth={0.75} />
      </g>

      {/* ── LOWER BOWL ── */}
      <g id="phase-lowerBowl" opacity={f.lower}>
        {LOWER.map((s, k) => (
          <g key={`lb${k}`}>
            <path d={s.riser} fill={T.lower.base} />
            <path d={s.tread} fill={T.lower.top} stroke={T.lower.base} strokeWidth={0.5} />
            <polygon points={s.cutA} fill={T.lower.cut} stroke="#96604D" strokeWidth={1} />
            <polygon points={s.cutB} fill={T.lower.cut} stroke="#96604D" strokeWidth={1} />
          </g>
        ))}
        {LOWER_AISLES.map((l, i) => ln(l, `la${i}`, "#fff", 1.2, 0.5))}
      </g>

      {/* ── UPPER BOWL: suite/club band + upper deck ── */}
      <g id="phase-upperBowl" opacity={f.upper}>
        <path d={SUITE.riser} fill={T.suite.base} />
        <path d={SUITE.tread} fill={T.suite.top} stroke={T.suite.base} strokeWidth={0.5} />
        <polygon points={SUITE.cutA} fill={T.suite.cut} stroke="#8E4267" strokeWidth={1} />
        <polygon points={SUITE.cutB} fill={T.suite.cut} stroke="#8E4267" strokeWidth={1} />
        {SUITE.ticks.map((p, i) => (
          <rect key={`stk${i}`} x={p[0] - 2} y={p[1]} width={4} height={12} fill="#FBD3E7" opacity={0.9} />
        ))}
        {UPPER.map((s, k) => (
          <g key={`ub${k}`}>
            <path d={s.riser} fill={T.upper.base} />
            <path d={s.tread} fill={T.upper.top} stroke={T.upper.base} strokeWidth={0.5} />
            <polygon points={s.cutA} fill={T.upper.cut} stroke="#96500F" strokeWidth={1} />
            <polygon points={s.cutB} fill={T.upper.cut} stroke="#96500F" strokeWidth={1} />
          </g>
        ))}
        {UPPER_AISLES.map((l, i) => ln(l, `ua${i}`, "#fff", 1.2, 0.55))}
      </g>

      {/* ── FIT-OUT: concessions, people, landscaping, paths, poles ── */}
      <g id="phase-eventFloor" opacity={f.floor}>
        {[isoBoxAt(174.3, 268.4, 11, 8, 8, 0, 11), isoBoxAt(-174.3, 268.4, 11, 8, -8, 0, 11)].map((b, i) => (
          <g key={`cn${i}`}>
            <polygon points={b.left} fill="#157758" />
            <polygon points={b.right} fill="#1D9E75" />
            <polygon points={b.top} fill="#45B18D" />
          </g>
        ))}
        {PEOPLE_FITOUT.map((p, i) => <circle key={`pf${i}`} cx={p[0]} cy={p[1]} r={2.2} fill="#3A3D40" />)}
        {/* paver paths: feature entry → plaza, arena → garage */}
        <path d="M 158 537 Q 300 640 480 676" fill="none" stroke="#DCD9D2" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <path d="M 790 628 Q 900 615 1000 578" fill="none" stroke="#DCD9D2" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <ellipse cx={250} cy={548} rx={40} ry={12} fill={T.green.hi} opacity={0.3} />
        <ellipse cx={672} cy={606} rx={36} ry={11} fill={T.green.hi} opacity={0.3} />
        {TREES.map(([x, y, s], i) => (
          <g key={`tr${i}`}>
            <ellipse cx={x + 3} cy={y + 2} rx={3 * s} ry={s} fill="#000" opacity={0.07} />
            <line x1={x} y1={y} x2={x} y2={y - 2.2 * s} stroke="#7A5A38" strokeWidth={1.6} />
            <circle cx={x} cy={y - 3 * s} r={1.8 * s} fill={T.green.lo} />
            <circle cx={x - 0.6 * s} cy={y - 3.5 * s} r={1.1 * s} fill={T.green.hi} />
          </g>
        ))}
        {POLES.map((p, i) => (
          <g key={`po${i}`}>
            <line x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - 14} stroke="#9DA2A6" strokeWidth={1.2} />
            <circle cx={p[0]} cy={p[1] - 16} r={2.5} fill="#E8C468" />
          </g>
        ))}
      </g>

      {/* ── FEATURE CANOPY (façade group; above glass bay + wall, below roof) ── */}
      <g id="phase-facade-canopy" opacity={f.facade}>
        <ellipse cx={CANOPY.shadow.cx} cy={CANOPY.shadow.cy} rx={52} ry={13} fill="#000" opacity={0.07} />
        {CANOPY.cols.map((c, i) => ln(c, `cc${i}`, "#6E4A12", 3, 1))}
        <polygon points={CANOPY.fasciaS2} fill={T.canopy.cut} />
        <polygon points={CANOPY.blade} fill={T.canopy.top} stroke={T.canopy.cut} strokeWidth={0.75} />
        <polygon points={CANOPY.fasciaOuter} fill={T.canopy.cut} />
        <polygon points={CANOPY.fasciaS1} fill={T.canopy.base} />
        {PEOPLE_ENTRY.map((p, i) => <circle key={`pe${i}`} cx={p[0]} cy={p[1]} r={2.2} fill="#3A3D40" />)}
        <line x1={150} y1={688} x2={102} y2={562} stroke={MUTED} strokeWidth={1} strokeDasharray="4 4" />
        <text x={168} y={702} textAnchor="middle" fontSize={11.5} fill={MUTED} fontWeight={600}>
          Feature entry &amp; canopy
        </text>
      </g>

      {/* Tower cranes (present during erection, gone before the roof) */}
      <CraneRig c={CR1} o={f.crane1} big />
      <CraneRig c={CR2} o={f.crane2} big={false} />

      {/* ── ROOF ── */}
      <g id="phase-roof" opacity={f.roof}>
        <path d={ROOFC.band} fill="url(#ctw-roof)" />
        <path d={ROOFC.innerEdge} fill="none" stroke="#6B2BB0" strokeWidth={2} />
        <path d={ROOFC.rim} fill="none" stroke="#CBA8FF" strokeWidth={1.5} />
        {ROOFC.truss.map((l, i) => ln(l, `rt${i}`, "#6B2BB0", 1.2, 0.7))}
        <path d={ROOFC.ring} fill="none" stroke="#6B2BB0" strokeWidth={2} opacity={0.8} />
        {ROOFC.mech.map((b, i) => (
          <g key={`mx${i}`}>
            <polygon points={b.left} fill="#5B23A0" />
            <polygon points={b.right} fill="#7433CB" />
            <polygon points={b.top} fill="#9B62E8" />
          </g>
        ))}
        <polygon points={ROOFC.cutA} fill={T.roof.cut} />
        <polygon points={ROOFC.cutB} fill={T.roof.cut} />
      </g>

      {/* Captions */}
      <text x={CX} y={764} textAnchor="middle" fontSize={12.5} fill={MUTED} fontWeight={600}>
        Arena bowl — cutaway view
      </text>
      <text x={1098} y={622} textAnchor="middle" fontSize={11.5} fill={MUTED} fontWeight={600}>
        Parking garage
      </text>
    </svg>
  );
}
