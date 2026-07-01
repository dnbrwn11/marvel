// StackedCostBar — one full-width horizontal bar segmented by division, each
// segment's width = that division's share of the total cost. Segments grow from
// zero on mount and re-tween their widths (CSS width transition) whenever inputs
// change — the "watch the money move" moment. Hovering a segment reveals its
// division name + cost. Reads the shared model; GAP palette.

import { useEffect, useState } from "react";
import type { LineItemGroup, ModelResult } from "../../model/types";
import { chartPalette } from "../../brand/tokens";
import { formatUSD } from "../shared/currency";

const GROUP_ORDER: LineItemGroup[] = [
  "Site & Structure",
  "Enclosure & Interiors",
  "Seating & Premium",
  "MEP & Fire",
  "Technology",
  "Parking & Site",
  "Fee, GCs & Markups (GAP submitted rates)",
];

// Short display names for the legend/hover readout.
const SHORT: Record<LineItemGroup, string> = {
  "Site & Structure": "Site & Structure",
  "Enclosure & Interiors": "Enclosure",
  "Seating & Premium": "Seating",
  "MEP & Fire": "MEP",
  Technology: "Technology",
  "Parking & Site": "Parking",
  "Fee, GCs & Markups (GAP submitted rates)": "Fee & GCs",
};

export function StackedCostBar({ model }: { model: ModelResult }) {
  const totals = new Map<LineItemGroup, number>();
  for (const it of model.items) {
    totals.set(it.group, (totals.get(it.group) ?? 0) + it.cost);
  }
  const data = GROUP_ORDER.filter((g) => totals.has(g)).map((group, i) => ({
    group,
    short: SHORT[group],
    cost: totals.get(group)!,
    color: chartPalette[i % chartPalette.length],
  }));
  const total = data.reduce((s, d) => s + d.cost, 0);

  // Grow-from-zero on mount: start at 0 width, flip to real widths next frame.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [hover, setHover] = useState<number | null>(null);
  const active = hover !== null ? data[hover] : null;

  return (
    <div>
      {/* Hover readout */}
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-teal">
          Where the money is
        </span>
        <span className="tabular-nums text-muted">
          {active ? (
            <>
              <span className="font-medium text-ink">{active.short}</span>
              {" — "}
              {formatUSD(active.cost)} ({((active.cost / total) * 100).toFixed(1)}%)
            </>
          ) : (
            "Hover a segment"
          )}
        </span>
      </div>

      {/* Segmented bar */}
      <div className="flex h-6 w-full overflow-hidden rounded-lg bg-panel ring-1 ring-card">
        {data.map((d, i) => (
          <div
            key={d.group}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            title={`${d.short}: ${formatUSD(d.cost)}`}
            className="h-full cursor-pointer"
            style={{
              width: mounted ? `${(d.cost / total) * 100}%` : "0%",
              backgroundColor: d.color,
              opacity: hover === null || hover === i ? 1 : 0.55,
              transition: "width 500ms cubic-bezier(0.22,1,0.36,1), opacity 150ms ease",
              transitionDelay: `${i * 35}ms`,
            }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {data.map((d) => (
          <span key={d.group} className="flex items-center gap-1.5 text-muted">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: d.color }}
            />
            {d.short}
          </span>
        ))}
      </div>
    </div>
  );
}
