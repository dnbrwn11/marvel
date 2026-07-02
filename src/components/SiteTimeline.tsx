import { useEffect, useRef, useState } from "react";
// Read the SHARED single source of truth (the provider's one instance) so the
// timeline's live total ties to the Program & Cost tab. useArena() returns
// { model, ... } — we use model.constructionCostEscalated as the live total.
import { useArena as useArenaModel } from "../state/ArenaModelContext";
import { formatUSDCompact } from "./shared/currency";
import { CONSTRUCTION_MONTHS, monthLabel, shortMonthLabel } from "../model/arenaCostModel";

// ─────────────────────────────────────────────────────────────────────────────
// SITE TIMELINE — a deliberate ~22s time-lapse of the build.
// ONE shared timeline value `t` (0→1) drives everything: the Gantt fills, the
// cumulative-spend curve overlaid on the Gantt, and the plan-view ring build.
// Cumulative cost = live escalated total (useArenaModel) × phase-weighted %.
// ─────────────────────────────────────────────────────────────────────────────

const DURATION_MS = 22_000; // a full play-through takes ~22s

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
const prog = (t: number, t0: number, t1: number) => clamp01((t - t0) / (t1 - t0));

// Plan-view phases + cumulative-spend weights (weights sum to 1 so the spend
// curve reaches the full escalated total at t = 1). Windows are fractions of t.
interface Phase {
  key: string;
  label: string;
  t0: number;
  t1: number;
  color: string;
  weight: number;
}
// Windows here match the cutaway's assembly phases so the spend curve, the
// Gantt cursor and the isometric build all move together on the shared t.
const PHASES: Phase[] = [
  { key: "foundations", label: "Foundations & site", t0: 0.0, t1: 0.12, color: "#9AA0A6", weight: 0.06 },
  { key: "parking", label: "Parking garage", t0: 0.08, t1: 0.32, color: "#4E5BA8", weight: 0.09 },
  { key: "structure", label: "Structure & concourse", t0: 0.14, t1: 0.42, color: "#00B0A8", weight: 0.14 },
  { key: "lowerBowl", label: "Lower bowl", t0: 0.3, t1: 0.52, color: "#F0997B", weight: 0.08 },
  { key: "upperBowl", label: "Upper bowl", t0: 0.36, t1: 0.58, color: "#F5821F", weight: 0.09 },
  { key: "facade", label: "Façade", t0: 0.46, t1: 0.68, color: "#EC008C", weight: 0.16 },
  { key: "roof", label: "Roof", t0: 0.54, t1: 0.74, color: "#9643FC", weight: 0.1 },
  { key: "eventFloor", label: "Event floor & fit-out", t0: 0.62, t1: 0.88, color: "#1D9E75", weight: 0.25 },
  { key: "commissioning", label: "Commissioning", t0: 0.9, t1: 1.0, color: "#5F5E5A", weight: 0.03 },
];

// Gantt = the real trade sequence across Feb 2028 → Aug 2030.
const GANTT: { label: string; t0: number; t1: number; color: string }[] = [
  { label: "Civil & utilities", t0: 0.0, t1: 0.14, color: "#9AA0A6" },
  { label: "Structural", t0: 0.12, t1: 0.42, color: "#00B0A8" },
  { label: "Parking garage", t0: 0.06, t1: 0.34, color: "#4E5BA8" },
  { label: "Architectural exterior", t0: 0.44, t1: 0.7, color: "#EC008C" },
  { label: "Architectural interior", t0: 0.55, t1: 0.86, color: "#F5821F" },
  { label: "Mechanical / plumbing", t0: 0.48, t1: 0.82, color: "#9643FC" },
  { label: "Electrical", t0: 0.52, t1: 0.86, color: "#F0997B" },
  { label: "Low voltage", t0: 0.62, t1: 0.9, color: "#378ADD" },
  { label: "Specialty construction", t0: 0.7, t1: 0.94, color: "#1D9E75" },
  { label: "Commissioning", t0: 0.9, t1: 1.0, color: "#5F5E5A" },
];

const costFrac = (t: number) =>
  PHASES.reduce((s, p) => s + p.weight * prog(t, p.t0, p.t1), 0);

// ── Gantt geometry ──
const GX0 = 178, GX1 = 812, GW = GX1 - GX0;
const GTOP = 28, GBOT = 312, GH = GBOT - GTOP;
const gx = (f: number) => GX0 + f * GW;
const gy = (cf: number) => GBOT - cf * GH;

// ─── Cutaway isometric arena — projection + octagon helpers ───────────────────
// iso(): world (x,y,z) → screen coords inside viewBox "0 0 680 330".
type Pt = [number, number];
const iso = (x: number, y: number, z: number): Pt => [
  322 + (x - y) * 11.26,
  205 + (x + y) * 6.5 - z * 13,
];
// Octagon footprint of "radius" s: a = s, b = 0.7·s (vertices V0…V7 in order).
const oct = (s: number): Pt[] => {
  const a = s, b = 0.7 * s;
  return [
    [-b, -a], [b, -a], [a, -b], [a, b],
    [b, a], [-b, a], [-a, b], [-a, -b],
  ] as Pt[];
};
// Cutaway rule: camera-facing edges 2,3,4 (V2→V3, V3→V4, V4→V5) are OMITTED so
// the interior is visible. Kept wall edges: 5,6,7,0,1. edge i spans Vi→V(i+1).
const KEPT = [5, 6, 7, 0, 1];
const CUT = [2, 3, 4];
const fmt = (p: Pt) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const poly = (pts: Pt[]) => pts.map(fmt).join(" ");
const octTop = (s: number, z: number): Pt[] => oct(s).map((v) => iso(v[0], v[1], z));
// Vertical wall quad along edge A→B, from zLo up to zHi.
const wallQuad = (A: Pt, B: Pt, zLo: number, zHi: number): Pt[] => [
  iso(A[0], A[1], zHi), iso(B[0], B[1], zHi), iso(B[0], B[1], zLo), iso(A[0], A[1], zLo),
];
// Wall quads for the given edge indices of octagon s, from zLo→zHi.
const edgeQuads = (s: number, edges: number[], zLo: number, zHi: number): string[] => {
  const v = oct(s);
  return edges.map((i) => poly(wallQuad(v[i], v[(i + 1) % 8], zLo, zHi)));
};
// 3 vertical lines (¼,½,¾ along the edge) per KEPT wall face, from zLo→zHi.
const columnLines = (s: number, zLo: number, zHi: number): [Pt, Pt][] => {
  const v = oct(s), out: [Pt, Pt][] = [];
  KEPT.forEach((i) => {
    const A = v[i], B = v[(i + 1) % 8];
    [0.25, 0.5, 0.75].forEach((f) => {
      const px = A[0] + (B[0] - A[0]) * f, py = A[1] + (B[1] - A[1]) * f;
      out.push([iso(px, py, zLo), iso(px, py, zHi)]);
    });
  });
  return out;
};
// 8 radial aisle lines from inner octagon si → outer octagon so at height z.
const aisleLines = (si: number, so: number, z: number): [Pt, Pt][] => {
  const vi = oct(si), vo = oct(so);
  return vi.map((_, i) => [iso(vi[i][0], vi[i][1], z), iso(vo[i][0], vo[i][1], z)] as [Pt, Pt]);
};
// Annular ring top (fill-rule evenodd): outer octagon + inner octagon hole at z.
const annular = (so: number, si: number, z: number) => {
  const o = octTop(so, z), inr = octTop(si, z);
  return `M ${o.map(fmt).join(" L ")} Z M ${inr.map(fmt).join(" L ")} Z`;
};

// ── Precomputed geometry (t only drives opacity, so shapes are built once) ──
const FND = { top: poly(octTop(7.6, 0.4)), front: edgeQuads(7.6, CUT, 0, 0.4) };

const PK = (() => {
  const x0 = 9.3, x1 = 12.6, y0 = -10, y1 = -4, h = 3.6;
  const top = poly([iso(x0, y0, h), iso(x1, y0, h), iso(x1, y1, h), iso(x0, y1, h)]);
  const faceX = poly([iso(x1, y0, h), iso(x1, y1, h), iso(x1, y1, 0), iso(x1, y0, 0)]);
  const faceY = poly([iso(x0, y1, h), iso(x1, y1, h), iso(x1, y1, 0), iso(x0, y1, 0)]);
  const levels: [Pt, Pt][] = [-8, -6].map((y) => [iso(x0, y, h), iso(x1, y, h)] as [Pt, Pt]);
  const ticks: [Pt, Pt][] = [];
  [-9, -7, -5].forEach((yc) => {
    for (let k = 0; k < 5; k++) {
      const xx = x0 + (x1 - x0) * ((k + 0.5) / 5);
      ticks.push([iso(xx, yc - 0.45, h), iso(xx, yc + 0.45, h)]);
    }
  });
  return { top, faceX, faceY, levels, ticks, ramp: iso(x1, y0, h) };
})();

const STR = {
  walls: KEPT.map((i, idx) => {
    const v = oct(7);
    return { d: poly(wallQuad(v[i], v[(i + 1) % 8], 0.4, 6.5)), fill: idx % 2 === 0 ? "#0E8B82" : "#0A7269" };
  }),
  cols: columnLines(7, 0.4, 6.5),
};

const UP = {
  top: annular(6.3, 4.9, 3.0),
  innerRisers: edgeQuads(4.9, KEPT, 1.9, 3.0),
  frontRisers: edgeQuads(6.3, CUT, 2.15, 3.0),
  aisles: aisleLines(4.9, 6.3, 3.0),
};

const LOW = {
  top: annular(4.9, 3.5, 1.9),
  innerRisers: edgeQuads(3.5, KEPT, 0.45, 1.9),
  frontRisers: edgeQuads(4.9, CUT, 1.05, 1.9),
  aisles: aisleLines(3.5, 4.9, 1.9),
};

const FLR = {
  slab: poly(octTop(3.4, 0.47)),
  court: poly([iso(-1.5, -0.95, 0.5), iso(1.5, -0.95, 0.5), iso(1.5, 0.95, 0.5), iso(-1.5, 0.95, 0.5)]),
  centerLine: [iso(0, -0.95, 0.5), iso(0, 0.95, 0.5)] as [Pt, Pt],
  centerCircle: iso(0, 0, 0.5),
};

const FAC = { parapet: edgeQuads(7, KEPT, 6.5, 6.95), ticks: columnLines(7, 5.4, 6.5) };

const buildCrane = (
  bx: number, by: number, mastZ: number, apexZ: number, jib: Pt, cj: Pt, hookXY: Pt, hookLoZ: number,
) => ({
  base: iso(bx, by, 0.5), mastTop: iso(bx, by, mastZ), apex: iso(bx, by, apexZ),
  jibTip: iso(jib[0], jib[1], mastZ), cjTip: iso(cj[0], cj[1], mastZ),
  hookTop: iso(hookXY[0], hookXY[1], mastZ), hookBot: iso(hookXY[0], hookXY[1], hookLoZ),
});
// Crane 1 rises inside the bowl; crane 2 serves the parking garage.
const CR1 = buildCrane(0.4, 0.6, 8.6, 9.3, [5.0, 0.6], [-1.2, 0.6], [3.8, 0.6], 7.2);
const CR2 = buildCrane(10.9, -11.2, 5.6, 6.1, [10.9, -7.6], [10.9, -12.5], [10.9, -8.8], 4.4);
type Crane = typeof CR1;

const ROOF = (() => {
  const o = oct(7.35), i = oct(3.3), z = 7.25;
  const half = [5, 6, 7, 0, 1, 2].map((k) => iso(o[k][0], o[k][1], z))
    .concat([2, 1, 0, 7, 6, 5].map((k) => iso(i[k][0], i[k][1], z)));
  const front = [2, 3, 4, 5].map((k) => iso(o[k][0], o[k][1], z));
  const truss: [Pt, Pt][] = [2, 3, 4, 5].map((k) => [iso(i[k][0], i[k][1], z), iso(o[k][0], o[k][1], z)] as [Pt, Pt]);
  const chords: [Pt, Pt][] = [
    [iso(i[2][0], i[2][1], z), iso(i[5][0], i[5][1], z)],
    [iso(i[3][0], i[3][1], z), iso(i[4][0], i[4][1], z)],
  ];
  return { half: poly(half), inner: poly(octTop(3.3, z)), front, truss, chords };
})();

const COMM = poly(octTop(8.1, 0.15));

const GHOST_FILL = "#E7EAEC", GHOST_STROKE = "#CFD3D7";
const LEGEND = [
  { label: "Foundations", color: "#9AA0A6" },
  { label: "Parking", color: "#4E5BA8" },
  { label: "Structure", color: "#00B0A8" },
  { label: "Lower bowl", color: "#F0997B" },
  { label: "Upper bowl", color: "#F5821F" },
  { label: "Façade", color: "#EC008C" },
  { label: "Roof", color: "#9643FC" },
  { label: "Fit-out", color: "#1D9E75" },
];

const MUTED = "#6B6E73", INK = "#1A1C1F", CARD = "#E3E5E8", TEAL = "#00B0A8";

// A tower crane: mast, jib + counter-jib, apex tie-lines, and a hoist block.
function CraneRig({ c, o, big }: { c: Crane; o: number; big: boolean }) {
  const mast = big ? 2 : 1.5, arm = big ? 2 : 1.5, thin = big ? 1 : 0.8;
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
      <rect x={c.hookBot[0] - 2} y={c.hookBot[1] - 2} width={4} height={4} fill="#44443F" stroke="none" />
    </g>
  );
}

export default function SiteTimeline() {
  const { model, inputs } = useArenaModel();
  const total = model?.constructionCostEscalated ?? 1_024_839_398;
  const start = inputs.constructionStartMonth; // schedule slides with the start date
  const scMonth = start + CONSTRUCTION_MONTHS; // substantial completion

  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);

  // rAF loop — time-based so a full play-through is ~22s regardless of frame rate.
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (ts: number) => {
      if (last === null) last = ts;
      const dt = ts - last;
      last = ts;
      const next = Math.min(1, tRef.current + dt / DURATION_MS);
      tRef.current = next;
      setT(next);
      if (next >= 1) { setPlaying(false); return; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const setBoth = (v: number) => { tRef.current = v; setT(v); };
  const togglePlay = () => {
    if (!playing && tRef.current >= 1) setBoth(0);
    setPlaying((p) => !p);
  };
  const onScrub = (v: number) => { setPlaying(false); setBoth(v); };

  // Derived readouts (all from the single shared t).
  const cf = costFrac(t);
  const cumulative = total * cf;
  const pct = Math.round(cf * 100);
  const dateLabel = monthLabel(start + Math.min(CONSTRUCTION_MONTHS, Math.round(t * CONSTRUCTION_MONTHS)));
  let activeBar = GANTT[0].label;
  GANTT.forEach((b) => { if (t >= b.t0) activeBar = b.label; });
  const activeLabel = t >= 1 ? `Complete — first event · ${monthLabel(scMonth)}` : activeBar;

  // Cutaway assembly fades — opacity 0→1 across each element's phase window.
  const fFound = prog(t, 0.0, 0.12);
  const fPark = prog(t, 0.08, 0.32);
  const fStruct = prog(t, 0.14, 0.42);
  const fLower = prog(t, 0.3, 0.52);
  const fUpper = prog(t, 0.36, 0.58);
  const fFacade = prog(t, 0.46, 0.68);
  const fRoof = prog(t, 0.54, 0.74);
  const fFloor = prog(t, 0.62, 0.88);
  const fComm = prog(t, 0.9, 1.0);
  // Cranes fade in during erection, then out before the roof closes.
  const fCrane1 = prog(t, 0.16, 0.23) * (1 - prog(t, 0.46, 0.55));
  const fCrane2 = prog(t, 0.08, 0.14) * (1 - prog(t, 0.28, 0.36));

  // Cumulative-spend curve points (drawn up to current t so it climbs).
  const steps = Math.max(1, Math.round(t * 160));
  const pts: [number, number][] = [];
  for (let k = 0; k <= steps; k++) {
    const tt = t * (k / steps);
    pts.push([gx(tt), gy(costFrac(tt))]);
  }
  const lineD = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const areaD = pts.length > 1
    ? `M ${gx(0)} ${GBOT} L ${pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ")} L ${pts[pts.length - 1][0].toFixed(1)} ${GBOT} Z`
    : "";

  return (
    <div className="space-y-6">
      {/* Readouts */}
      <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Construction progress
            </div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="font-display text-3xl font-light text-ink">{dateLabel}</span>
              <span className="text-sm font-medium text-teal">{activeLabel}</span>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cumulative cost</div>
              <div className="mt-1 font-display text-3xl font-light tabular-nums text-teal">{formatUSDCompact(cumulative)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">Complete</div>
              <div className="mt-1 font-display text-3xl font-light tabular-nums text-ink">{pct}%</div>
            </div>
          </div>
        </div>
        <div className="gap-tricolor mt-4 rounded-full" />
      </div>

      {/* Gantt + cumulative spend */}
      <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal">
          Phase schedule &amp; cumulative spend
        </div>
        <svg viewBox="0 0 900 344" width="100%" role="img" aria-label="Phase schedule Gantt with cumulative spend curve">
          {/* Gantt bars */}
          {GANTT.map((b, i) => {
            const y = GTOP + i * ((GH - 8) / GANTT.length);
            const h = (GH - 8) / GANTT.length - 6;
            const x0 = gx(b.t0), x1 = gx(b.t1);
            const f = prog(t, b.t0, b.t1);
            return (
              <g key={b.label}>
                <text x={GX0 - 10} y={y + h / 2 + 4} textAnchor="end" fontSize={10.5} fill={INK}>{b.label}</text>
                <rect x={x0} y={y} width={Math.max(0, x1 - x0)} height={h} rx={3} fill={b.color} opacity={0.16} />
                <rect x={x0} y={y} width={Math.max(0, (x1 - x0) * f)} height={h} rx={3} fill={b.color} />
              </g>
            );
          })}

          {/* Right $ axis */}
          <line x1={GX1} y1={GTOP} x2={GX1} y2={GBOT} stroke={CARD} strokeWidth={1} />
          <text x={GX1 + 8} y={GTOP + 4} fontSize={10} fill={MUTED}>{formatUSDCompact(total)}</text>
          <text x={GX1 + 8} y={gy(0.5) + 3} fontSize={10} fill={MUTED}>{formatUSDCompact(total * 0.5)}</text>
          <text x={GX1 + 8} y={GBOT + 2} fontSize={10} fill={MUTED}>$0</text>
          <text x={GX1 + 8} y={GTOP - 12} fontSize={9} fill={MUTED} fontWeight={600}>CUM. SPEND</text>

          {/* Cumulative-spend curve (on top of the Gantt) */}
          {areaD && <path d={areaD} fill={TEAL} opacity={0.08} />}
          {pts.length > 1 && <path d={lineD} fill="none" stroke={TEAL} strokeWidth={3} strokeLinejoin="round" />}
          {/* current-time cursor + marker */}
          <line x1={gx(t)} y1={GTOP} x2={gx(t)} y2={GBOT} stroke={INK} strokeWidth={1} strokeDasharray="3 3" opacity={0.35} />
          <circle cx={gx(t)} cy={gy(cf)} r={5} fill={TEAL} stroke="#fff" strokeWidth={2} />

          {/* x-axis labels */}
          <text x={gx(0)} y={GBOT + 20} fontSize={10} fill={MUTED} textAnchor="start">{shortMonthLabel(start)} · start</text>
          <text x={gx(0.5)} y={GBOT + 20} fontSize={10} fill={MUTED} textAnchor="middle">construction</text>
          <text x={gx(1)} y={GBOT + 20} fontSize={10} fill={MUTED} textAnchor="end">{shortMonthLabel(scMonth)}</text>
        </svg>
      </div>

      {/* Cutaway isometric arena — assembles by construction phase */}
      <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal">
          Arena assembly — cutaway isometric
        </div>
        <svg viewBox="0 0 680 330" width="100%" role="img" aria-label="Cutaway isometric arena assembling by construction phase">
          <rect x={0} y={0} width={680} height={330} rx={16} fill="#F6F7F8" />

          {/* Ground */}
          <ellipse cx={330} cy={212} rx={308} ry={104} fill="#EDEFF1" />

          {/* Foundation slab */}
          <polygon points={FND.top} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          <g opacity={fFound}>
            {FND.front.map((d, i) => <polygon key={i} points={d} fill="#9AA0A6" />)}
            <polygon points={FND.top} fill="#B4B7BB" />
          </g>

          {/* Parking garage */}
          <g>
            <polygon points={PK.faceX} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
            <polygon points={PK.faceY} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
            <polygon points={PK.top} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          </g>
          <g opacity={fPark}>
            <polygon points={PK.faceX} fill="#3A4680" />
            <polygon points={PK.faceY} fill="#4E5BA8" />
            <polygon points={PK.top} fill="#8B99C9" />
            {PK.levels.map((l, i) => (
              <line key={`pl${i}`} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#fff" strokeWidth={1} opacity={0.9} />
            ))}
            {PK.ticks.map((l, i) => (
              <line key={`pt${i}`} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#fff" strokeWidth={1} opacity={0.75} />
            ))}
            <ellipse cx={PK.ramp[0]} cy={PK.ramp[1]} rx={11} ry={6} fill="none" stroke="#fff" strokeWidth={1} opacity={0.9} />
            <ellipse cx={PK.ramp[0]} cy={PK.ramp[1]} rx={5.5} ry={3} fill="none" stroke="#fff" strokeWidth={1} opacity={0.9} />
          </g>

          {/* Superstructure */}
          <g>
            {STR.walls.map((w, i) => <polygon key={i} points={w.d} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />)}
          </g>
          <g opacity={fStruct}>
            {STR.walls.map((w, i) => <polygon key={i} points={w.d} fill={w.fill} stroke="#fff" strokeWidth={0.75} strokeOpacity={0.6} />)}
            {STR.cols.map((l, i) => (
              <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#fff" strokeWidth={1} opacity={0.55} />
            ))}
          </g>

          {/* Upper bowl tier */}
          <path d={UP.top} fillRule="evenodd" fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          <g opacity={fUpper}>
            {UP.frontRisers.map((d, i) => <polygon key={`ufr${i}`} points={d} fill="#C2660F" />)}
            {UP.innerRisers.map((d, i) => <polygon key={`uir${i}`} points={d} fill="#C2660F" />)}
            <path d={UP.top} fillRule="evenodd" fill="#F5821F" />
            {UP.aisles.map((l, i) => (
              <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#fff" strokeWidth={1} opacity={0.7} />
            ))}
          </g>

          {/* Lower bowl tier */}
          <path d={LOW.top} fillRule="evenodd" fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          <g opacity={fLower}>
            {LOW.frontRisers.map((d, i) => <polygon key={`lfr${i}`} points={d} fill="#C97A5D" />)}
            {LOW.innerRisers.map((d, i) => <polygon key={`lir${i}`} points={d} fill="#C97A5D" />)}
            <path d={LOW.top} fillRule="evenodd" fill="#F0997B" />
            {LOW.aisles.map((l, i) => (
              <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#fff" strokeWidth={1} opacity={0.7} />
            ))}
          </g>

          {/* Event floor & court */}
          <polygon points={FLR.slab} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          <g opacity={fFloor}>
            <polygon points={FLR.slab} fill="#2AA381" />
            <polygon points={FLR.court} fill="#C89A6B" />
            <line x1={FLR.centerLine[0][0]} y1={FLR.centerLine[0][1]} x2={FLR.centerLine[1][0]} y2={FLR.centerLine[1][1]} stroke="#fff" strokeWidth={1} opacity={0.9} />
            <ellipse cx={FLR.centerCircle[0]} cy={FLR.centerCircle[1]} rx={6.5} ry={3.6} fill="none" stroke="#fff" strokeWidth={1} opacity={0.9} />
          </g>

          {/* Façade */}
          <g opacity={fFacade}>
            {FAC.parapet.map((d, i) => <polygon key={i} points={d} fill="#EC008C" />)}
            {FAC.ticks.map((l, i) => (
              <line key={i} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#EC008C" strokeWidth={1.5} />
            ))}
          </g>

          {/* Tower cranes (present during erection, gone before the roof) */}
          <CraneRig c={CR1} o={fCrane1} big />
          <CraneRig c={CR2} o={fCrane2} big={false} />

          {/* Roof — solid half-ring over the kept walls only */}
          <polygon points={ROOF.half} fill={GHOST_FILL} stroke={GHOST_STROKE} strokeWidth={0.5} />
          <g opacity={fRoof}>
            <polygon points={ROOF.half} fill="#9643FC" fillOpacity={0.82} />
            <polygon points={ROOF.inner} fill="none" stroke="#9643FC" strokeWidth={2} />
            <polyline points={poly(ROOF.front)} fill="none" stroke="#9643FC" strokeWidth={2.4} />
            {ROOF.truss.map((l, i) => (
              <line key={`rt${i}`} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#9643FC" strokeWidth={1.5} />
            ))}
            {ROOF.chords.map((l, i) => (
              <line key={`rc${i}`} x1={l[0][0]} y1={l[0][1]} x2={l[1][0]} y2={l[1][1]} stroke="#9643FC" strokeWidth={1.5} />
            ))}
          </g>

          {/* Commissioning outline */}
          <g opacity={fComm}>
            <polygon points={COMM} fill="none" stroke="#639922" strokeWidth={1.5} strokeDasharray="5 4" />
          </g>

          {/* Labels */}
          <text x={322} y={312} textAnchor="middle" fontSize={12} fill={MUTED} fontWeight={600}>Arena bowl — cutaway view</text>
          <text x={536} y={282} textAnchor="middle" fontSize={11} fill={MUTED} fontWeight={600}>Parking garage</text>
        </svg>

        {/* Phase color legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          {LEGEND.map((p) => (
            <span key={p.label} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Cutaway isometric assembling by construction phase · driven by the shared timeline · cumulative cost distributed from the live program model.
        </p>
      </div>

      {/* Shared controls */}
      <div className="rounded-2xl border border-card bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-95"
          >
            {playing ? (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><rect x="5" y="4" width="4" height="12" rx="1" /><rect x="11" y="4" width="4" height="12" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor"><path d="M6 4l10 6-10 6V4z" /></svg>
            )}
            <span>{playing ? "Pause" : t >= 1 ? "Replay" : "Play"}</span>
          </button>
          <input
            type="range"
            min={0}
            max={1000}
            step={1}
            value={Math.round(t * 1000)}
            onChange={(e) => onScrub(Number(e.target.value) / 1000)}
            className="flex-1 accent-teal"
            aria-label="Timeline scrubber"
          />
        </div>
        <div className="mt-2 flex justify-between px-1 text-[11px] text-muted">
          <span>{monthLabel(start)} · start</span>
          <span>~22s time-lapse · construction sequence</span>
          <span>{monthLabel(scMonth)} · first event</span>
        </div>
      </div>
    </div>
  );
}
