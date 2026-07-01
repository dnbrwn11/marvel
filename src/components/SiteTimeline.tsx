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
const PHASES: Phase[] = [
  { key: "foundations", label: "Foundations & site", t0: 0.0, t1: 0.12, color: "#9AA0A6", weight: 0.08 },
  { key: "parking", label: "Parking garage", t0: 0.06, t1: 0.34, color: "#4E5BA8", weight: 0.1 },
  { key: "structure", label: "Structure & concourse", t0: 0.12, t1: 0.42, color: "#00B0A8", weight: 0.2 },
  { key: "upperBowl", label: "Upper bowl", t0: 0.3, t1: 0.55, color: "#F5821F", weight: 0.1 },
  { key: "lowerBowl", label: "Lower bowl", t0: 0.34, t1: 0.6, color: "#F0997B", weight: 0.1 },
  { key: "facade", label: "Façade", t0: 0.44, t1: 0.7, color: "#EC008C", weight: 0.12 },
  { key: "roof", label: "Roof", t0: 0.54, t1: 0.74, color: "#9643FC", weight: 0.08 },
  { key: "eventFloor", label: "Event floor & fit-out", t0: 0.6, t1: 0.9, color: "#1D9E75", weight: 0.17 },
  { key: "commissioning", label: "Commissioning", t0: 0.9, t1: 1.0, color: "#5F5E5A", weight: 0.05 },
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

// ── Plan geometry / ring helpers ──
const CX = 212, CY = 184, RF = 0.7;
function ellipsePath(cx: number, cy: number, rx: number, ry: number) {
  return `M ${cx - rx} ${cy} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;
}
// True ring: outer ellipse + inner ellipse cutout via fill-rule evenodd.
function ringPath(cx: number, cy: number, rxO: number, rxI: number) {
  return `${ellipsePath(cx, cy, rxO, rxO * RF)} ${ellipsePath(cx, cy, rxI, rxI * RF)}`;
}

const MUTED = "#6B6E73", INK = "#1A1C1F", CARD = "#E3E5E8", TEAL = "#00B0A8";

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

  const pp: Record<string, number> = {};
  PHASES.forEach((p) => { pp[p.key] = prog(t, p.t0, p.t1); });

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

      {/* Plan-view rings + parking */}
      <div className="rounded-2xl border border-card bg-surface p-6 shadow-sm">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-teal">
          Arena plan — build sequence
        </div>
        <svg viewBox="0 0 720 380" width="100%" role="img" aria-label="Plan view of the arena building ring by ring">
          {/* Foundations pad (base, under the rings) */}
          <path d={ellipsePath(CX, CY, 208, 208 * RF)} fill="#9AA0A6" opacity={0.45 * pp.foundations} />

          {/* Rings — true annular rings via fill-rule evenodd; each in its own band */}
          <path d={ringPath(CX, CY, 200, 190)} fillRule="evenodd" fill="#EC008C" opacity={pp.facade} />
          <path d={ringPath(CX, CY, 188, 156)} fillRule="evenodd" fill="#00B0A8" opacity={pp.structure} />
          <path d={ringPath(CX, CY, 154, 124)} fillRule="evenodd" fill="#F5821F" opacity={pp.upperBowl} />
          <path d={ringPath(CX, CY, 122, 90)} fillRule="evenodd" fill="#F0997B" opacity={pp.lowerBowl} />

          {/* Event floor (solid center) + court */}
          <path d={ellipsePath(CX, CY, 88, 88 * RF)} fill="#1D9E75" opacity={pp.eventFloor} />
          <rect x={CX - 34} y={CY - 15} width={68} height={30} rx={3} fill="#FFFFFF" opacity={0.85 * pp.eventFloor} />
          <line x1={CX} y1={CY - 15} x2={CX} y2={CY + 15} stroke="#1D9E75" strokeWidth={1.5} opacity={0.7 * pp.eventFloor} />

          {/* Roof overlay (semi-transparent, reads as an overlay above the bowl) */}
          <path d={ringPath(CX, CY, 176, 104)} fillRule="evenodd" fill="#9643FC" opacity={0.55 * pp.roof} />

          <text x={CX} y={CY + 168} textAnchor="middle" fontSize={12} fill={MUTED} fontWeight={600}>Arena bowl</text>

          {/* Parking garage — rounded rect with deck grid appearing as it builds */}
          <g>
            <rect x={470} y={118} width={200} height={150} rx={12} fill="#4E5BA8" opacity={pp.parking} />
            {[1, 2, 3, 4, 5].map((k) => (
              <line key={k} x1={470 + (k * 200) / 6} y1={118} x2={470 + (k * 200) / 6} y2={268}
                stroke="#FFFFFF" strokeWidth={1} opacity={0.8 * pp.parking} />
            ))}
            <line x1={470} y1={193} x2={670} y2={193} stroke="#FFFFFF" strokeWidth={1} opacity={0.8 * pp.parking} />
            <text x={570} y={300} textAnchor="middle" fontSize={12} fill={MUTED} fontWeight={600}>Parking garage</text>
          </g>
        </svg>

        {/* Phase color legend */}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
          {PHASES.map((p) => (
            <span key={p.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
              {p.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Plan-view build sequence driven by the shared timeline · cumulative cost distributed from the live program model.
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
