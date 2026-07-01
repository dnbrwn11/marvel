import { useMemo, useRef, useState, useEffect } from "react";
// Read the SHARED single source of truth (the provider's one instance) so the
// timeline's live total ties to the Program & Cost tab. useArena() returns the
// same shape { model, ... } the component expects.
import { useArena as useArenaModel } from "../state/ArenaModelContext";

// ─────────────────────────────────────────────────────────────────────────────
// SITE TIMELINE — the "4D" showpiece.
// Top: animated phase-schedule Gantt + cumulative cost S-curve (the real
//      Feb 2028 → Aug 2030 construction sequence from the RFP).
// Bottom: a 2D building cross-section that rises as the schedule progresses.
// One scrubber + play button drives both. Cumulative cost is the LIVE escalated
// total from useArenaModel, distributed across phases — so it always ties to the
// Program & Cost tab.
// ─────────────────────────────────────────────────────────────────────────────

interface Phase {
  name: string;
  t0: number; // start, 0..1 of construction window
  t1: number; // finish
  w: number;  // cost weight (share of total); weights sum to 1
  col: string;
}

// Real trade sequence (GAP RFP schedule), weighted to a realistic spend profile.
const PHASES: Phase[] = [
  { name: "Civil & utilities", t0: 0.0, t1: 0.16, w: 0.08, col: "#8C9298" },
  { name: "Structural", t0: 0.1, t1: 0.42, w: 0.13, col: "#00B0A8" },
  { name: "Parking garage", t0: 0.14, t1: 0.36, w: 0.09, col: "#4E5BA8" },
  { name: "Architectural — exterior", t0: 0.34, t1: 0.64, w: 0.18, col: "#EC008C" },
  { name: "Architectural — interior", t0: 0.48, t1: 0.82, w: 0.16, col: "#F5821F" },
  { name: "Mechanical / plumbing", t0: 0.44, t1: 0.86, w: 0.13, col: "#9643FC" },
  { name: "Electrical", t0: 0.5, t1: 0.88, w: 0.08, col: "#1D9E75" },
  { name: "Low voltage", t0: 0.58, t1: 0.9, w: 0.05, col: "#378ADD" },
  { name: "Specialty construction", t0: 0.66, t1: 0.94, w: 0.07, col: "#D85A30" },
  { name: "Commissioning", t0: 0.9, t1: 1.0, w: 0.03, col: "#5F5E5A" },
];

const MONTHS = ["Feb 2028","Apr 2028","Jun 2028","Aug 2028","Oct 2028","Dec 2028","Feb 2029","Apr 2029","Jun 2029","Aug 2029","Oct 2029","Dec 2029","Feb 2030","Apr 2030","Jun 2030","Aug 2030"];

const fmtM = (v: number) => `$${(v / 1e6).toFixed(0)}M`;
const costFrac = (t: number) =>
  PHASES.reduce((s, p) => {
    const f = Math.max(0, Math.min(1, (t - p.t0) / (p.t1 - p.t0)));
    return s + p.w * f;
  }, 0);

export default function SiteTimeline() {
  const { model } = useArenaModel();
  // Live escalated total from the engine (fallback keeps it renderable standalone)
  const TOTAL = model?.constructionCostEscalated ?? 1_024_839_398;

  const [t, setT] = useState(0); // 0..1
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!playing) return;
    const tick = () => {
      setT((prev) => {
        const next = prev + 0.006;
        if (next >= 1) { setPlaying(false); return 1; }
        raf.current = requestAnimationFrame(tick);
        return next;
      });
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing]);

  const dateLabel = MONTHS[Math.min(15, Math.round(t * 15))];
  const cf = costFrac(t);
  const activePhase = useMemo(() => {
    let a = PHASES[0].name;
    PHASES.forEach((p) => {
      const f = (t - p.t0) / (p.t1 - p.t0);
      if (f > 0) a = p.name;
    });
    return t >= 1 ? "Complete — first event" : a;
  }, [t]);

  // ── schedule svg geometry ──
  const SX = 140, SW = 680 - SX - 24, SY = 16, rowH = 20, gap = 4;
  const barsBottom = SY + PHASES.length * (rowH + gap);
  const curveTop = barsBottom + 18, curveBot = 290, curveH = curveBot - curveTop;
  const curvePts = useMemo(() => {
    const pts: [number, number][] = [];
    const upto = Math.round(t * 120);
    for (let k = 0; k <= upto; k++) {
      const tt = k / 120;
      pts.push([SX + tt * SW, curveBot - costFrac(tt) * curveH]);
    }
    return pts;
  }, [t]);
  const curveD = curvePts.length > 1 ? "M" + curvePts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") : "";
  const areaD = curvePts.length > 1
    ? `M${SX} ${curveBot} L` + curvePts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + ` L${curvePts[curvePts.length - 1][0].toFixed(1)} ${curveBot} Z`
    : "";
  const markerX = SX + t * SW;

  // ── section pieces: {el jsx, at (costFrac threshold), span} ──
  const base = 190;
  const sectionOpacity = (at: number, span = 0.12) => Math.max(0, Math.min(1, (cf - at) / span));

  return (
    <div style={{ fontFamily: "Barlow, Inter, system-ui, sans-serif" }}>
      {/* Readouts */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: "#6B6E73", letterSpacing: ".04em" }}>CONSTRUCTION PROGRESS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 2 }}>
            <span style={{ fontSize: 26, fontWeight: 500, color: "#1A1C1F" }}>{dateLabel}</span>
            <span style={{ fontSize: 14, color: "#00B0A8", fontWeight: 500 }}>{activePhase}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 22 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6B6E73" }}>Cumulative cost</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#00B0A8" }}>{fmtM(cf * TOTAL)}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#6B6E73" }}>Complete</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: "#1A1C1F" }}>{Math.round(cf * 100)}%</div>
          </div>
        </div>
      </div>

      {/* Schedule + cash flow */}
      <div style={{ fontSize: 11, fontWeight: 500, color: "#6B6E73", letterSpacing: ".04em", marginBottom: 4 }}>PHASE SCHEDULE & CASH FLOW</div>
      <svg width="100%" viewBox="0 0 680 300" style={{ display: "block", background: "#F6F7F8", borderRadius: 12 }} role="img">
        <title>Phase schedule and cumulative cost curve</title>
        {PHASES.map((p, i) => {
          const y = SY + i * (rowH + gap);
          const x0 = SX + p.t0 * SW, x1 = SX + p.t1 * SW;
          const f = Math.max(0, Math.min(1, (t - p.t0) / (p.t1 - p.t0)));
          return (
            <g key={p.name}>
              <text x={SX - 8} y={y + rowH / 2 + 4} textAnchor="end" fontSize={11} fill="#44443F">{p.name}</text>
              <rect x={x0} y={y} width={x1 - x0} height={rowH} rx={4} fill={p.col} opacity={0.18} />
              <rect x={x0} y={y} width={(x1 - x0) * f} height={rowH} rx={4} fill={p.col} />
            </g>
          );
        })}
        <line x1={SX} y1={curveBot} x2={SX + SW} y2={curveBot} stroke="#C4C8CC" strokeWidth={1} />
        <text x={SX - 8} y={curveTop + 6} textAnchor="end" fontSize={10} fill="#6B6E73">{fmtM(TOTAL)}</text>
        <text x={SX - 8} y={curveBot} textAnchor="end" fontSize={10} fill="#6B6E73">$0</text>
        {areaD && <path d={areaD} fill="#00B0A8" opacity={0.1} />}
        {curveD && <path d={curveD} fill="none" stroke="#00B0A8" strokeWidth={2} />}
        <line x1={markerX} y1={SY} x2={markerX} y2={curveBot} stroke="#1A1C1F" strokeWidth={1} strokeDasharray="3 3" opacity={0.5} />
        <circle cx={markerX} cy={curveBot - cf * curveH} r={4} fill="#00B0A8" />
      </svg>

      {/* Building section */}
      <div style={{ fontSize: 11, fontWeight: 500, color: "#6B6E73", letterSpacing: ".04em", margin: "14px 0 4px" }}>BUILDING SECTION</div>
      <svg width="100%" viewBox="0 0 680 220" style={{ display: "block", background: "#F6F7F8", borderRadius: 12 }} role="img">
        <title>Building cross-section rising</title>
        <line x1={60} y1={base} x2={620} y2={base} stroke="#B4B2A9" strokeWidth={2} />
        {/* foundation */}
        <path d={`M150 ${base} L530 ${base} L520 ${base - 12} L160 ${base - 12} Z`} fill="#9AA0A6" opacity={sectionOpacity(0.0, 0.08)} />
        {/* structure columns */}
        {[180, 255, 330, 405, 480].map((x) => (
          <rect key={x} x={x} y={base - 110} width={12} height={110} fill="#00B0A8" opacity={sectionOpacity(0.1, 0.3)} />
        ))}
        {/* bowl */}
        <path d={`M235 ${base - 12} L300 ${base - 70} L380 ${base - 70} L445 ${base - 12} Z`} fill="#F5821F" opacity={sectionOpacity(0.2, 0.3)} />
        {/* upper deck */}
        <path d={`M255 ${base - 72} L300 ${base - 100} L380 ${base - 100} L425 ${base - 72} Z`} fill="#F0997B" opacity={sectionOpacity(0.35, 0.2)} />
        {/* roof */}
        <path d={`M165 ${base - 110} L340 ${base - 150} L515 ${base - 110} L515 ${base - 122} L340 ${base - 162} L165 ${base - 122} Z`} fill="#7E4FB0" opacity={sectionOpacity(0.55, 0.18)} />
        {/* façade walls */}
        <rect x={160} y={base - 118} width={14} height={106} fill="#EC008C" opacity={sectionOpacity(0.62, 0.18)} />
        <rect x={506} y={base - 118} width={14} height={106} fill="#EC008C" opacity={sectionOpacity(0.62, 0.18)} />
        {/* fit-out core */}
        <rect x={290} y={base - 58} width={100} height={46} rx={3} fill="#1D9E75" opacity={sectionOpacity(0.72, 0.2)} />
      </svg>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, border: "none", background: "#00B0A8", color: "#fff", fontWeight: 500, fontSize: 14, cursor: "pointer" }}
        >
          <i className={`ti ${playing ? "ti-player-pause" : "ti-player-play"}`} aria-hidden="true" />
          <span>{playing ? "Pause" : "Play"}</span>
        </button>
        <input
          type="range" min={0} max={120} value={Math.round(t * 120)} step={1}
          onChange={(e) => { setPlaying(false); setT(+e.target.value / 120); }}
          style={{ flex: 1 }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6B6E73", marginTop: 4, padding: "0 2px" }}>
        <span>Feb 2028 · start</span><span>construction</span><span>Aug 2030 · first event</span>
      </div>

      <div style={{ fontSize: 11, color: "#6B6E73", marginTop: 10 }}>
        Schedule per GAP Partners RFP sequence · cumulative cost distributed from the live program model.
      </div>
    </div>
  );
}
