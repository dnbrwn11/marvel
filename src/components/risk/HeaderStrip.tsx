// HeaderStrip — the three Risk Register KPI cards:
//   1) GMP-tier weighted exposure, with a gauge vs the LIVE contingency line
//      item pulled straight from computeModel output (model.contingency).
//   2) Owner/Program-tier weighted exposure (outside GMP — no gauge).
//   3) Open-risk count with mitigating/retired sub-counts.
// All figures are derived from the priced register; nothing is hardcoded.

import { colors } from "../../brand/tokens";
import { formatUSDCompact } from "../shared/currency";
import { useCountUp } from "../shared/useCountUp";

interface HeaderStripProps {
  gmpExposure: number;
  ownerExposure: number;
  contingency: number;
  openCount: number;
  mitigatingCount: number;
  retiredCount: number;
}

export function HeaderStrip({
  gmpExposure,
  ownerExposure,
  contingency,
  openCount,
  mitigatingCount,
  retiredCount,
}: HeaderStripProps) {
  const gmpShown = useCountUp(gmpExposure, { duration: 400, mountDuration: 900 });
  const ownerShown = useCountUp(ownerExposure, { duration: 400, mountDuration: 900 });
  const over = gmpExposure > contingency;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* 1. GMP-tier weighted exposure + contingency gauge */}
      <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.teal }} />
        <div className="text-xs font-medium uppercase tracking-wider text-muted">
          GMP-Tier Weighted Exposure
        </div>
        <div
          className="mt-2 font-display text-3xl font-light tabular-nums"
          style={{ color: over ? colors.magenta : colors.ink }}
        >
          {formatUSDCompact(gmpShown)}
        </div>
        <div className="mt-1 text-sm text-muted">
          vs contingency {formatUSDCompact(contingency)} (3% of COW, live from model)
        </div>
        <ContingencyGauge exposure={gmpExposure} contingency={contingency} over={over} />
      </div>

      {/* 2. Owner/Program-tier weighted exposure (no gauge) */}
      <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.orange }} />
        <div className="text-xs font-medium uppercase tracking-wider text-muted">
          Owner/Program-Tier Weighted Exposure
        </div>
        <div className="mt-2 font-display text-3xl font-light tabular-nums text-ink">
          {formatUSDCompact(ownerShown)}
        </div>
        <div className="mt-1 text-sm text-muted">
          owner program contingency — <span className="font-medium text-ink">NOT within GMP</span>
        </div>
      </div>

      {/* 3. Open risks */}
      <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm">
        <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: colors.magenta }} />
        <div className="text-xs font-medium uppercase tracking-wider text-muted">
          Open Risks
        </div>
        <div className="mt-2 font-display text-3xl font-light tabular-nums text-ink">
          {openCount}
        </div>
        <div className="mt-1 text-sm text-muted">
          {mitigatingCount} mitigating · {retiredCount} retired
        </div>
      </div>
    </div>
  );
}

// Horizontal gauge: teal fill spans the contingency budget; an overlaid marker
// sits at the weighted GMP exposure. Marker turns magenta once exposure exceeds
// contingency. Scale accommodates whichever is larger so both stay visible.
function ContingencyGauge({
  exposure,
  contingency,
  over,
}: {
  exposure: number;
  contingency: number;
  over: boolean;
}) {
  const scale = Math.max(contingency, exposure, 1) * 1.08;
  const fillPct = Math.min(100, (contingency / scale) * 100);
  const markerPct = Math.min(100, (exposure / scale) * 100);
  return (
    <div className="mt-4">
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-panel">
        {/* teal fill = contingency budget */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{ width: `${fillPct}%`, backgroundColor: "rgba(0,176,168,0.35)" }}
        />
        {/* boundary line at the contingency budget */}
        <div
          className="absolute inset-y-0 w-px"
          style={{ left: `${fillPct}%`, backgroundColor: colors.teal }}
        />
        {/* exposure marker */}
        <div
          className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow transition-[left] duration-500"
          style={{
            left: `${markerPct}%`,
            backgroundColor: over ? colors.magenta : colors.teal,
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px]">
        <span className="text-muted">weighted GMP exposure</span>
        <span
          className="font-medium"
          style={{ color: over ? colors.magenta : colors.muted }}
        >
          {over ? "exceeds contingency" : "within contingency"}
        </span>
      </div>
    </div>
  );
}
