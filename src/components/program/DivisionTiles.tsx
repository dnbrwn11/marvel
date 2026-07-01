// DivisionTiles — the hero content: the cost structure as a grid of explorable
// division objects. Each tile shows the division name, its total (count-animated),
// its % of total, and a mini bar sized to its share (GAP palette). Clicking a tile
// expands its line items (label, basis, cost). Tiles fade/grow in staggered on
// load and re-tween their values + bar widths when the program changes. Reads the
// shared model — layout/animation only, no math changes.

import { useEffect, useState } from "react";
import type { LineItem, LineItemGroup, ModelResult } from "../../model/types";
import { chartPalette } from "../../brand/tokens";
import { useCountUp } from "../shared/useCountUp";
import { formatUSD, formatUSDCompact } from "../shared/currency";

const GROUP_ORDER: LineItemGroup[] = [
  "Site & Structure",
  "Enclosure & Interiors",
  "Seating & Premium",
  "MEP & Fire",
  "Technology",
  "Parking & Site",
  "Fee, GCs & Markups (GAP submitted rates)",
];

const SHORT: Record<LineItemGroup, string> = {
  "Site & Structure": "Site & Structure",
  "Enclosure & Interiors": "Enclosure & Interiors",
  "Seating & Premium": "Seating & Premium",
  "MEP & Fire": "MEP & Fire",
  Technology: "Technology",
  "Parking & Site": "Parking & Site",
  "Fee, GCs & Markups (GAP submitted rates)": "Fee & GCs",
};

export function DivisionTiles({ model }: { model: ModelResult }) {
  const byGroup = new Map<LineItemGroup, LineItem[]>();
  for (const it of model.items) {
    const list = byGroup.get(it.group) ?? [];
    list.push(it);
    byGroup.set(it.group, list);
  }
  const divisions = GROUP_ORDER.filter((g) => byGroup.has(g)).map((group, i) => {
    const items = byGroup.get(group)!;
    return {
      group,
      short: SHORT[group],
      items,
      cost: items.reduce((s, it) => s + it.cost, 0),
      color: chartPalette[i % chartPalette.length],
    };
  });
  const grand = divisions.reduce((s, d) => s + d.cost, 0);
  const max = divisions.reduce((m, d) => Math.max(m, d.cost), 0);

  // Grow-from-zero bars on mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const [open, setOpen] = useState<Set<LineItemGroup>>(new Set());
  const toggle = (g: LineItemGroup) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(g)) next.delete(g);
      else next.add(g);
      return next;
    });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {divisions.map((d, i) => (
        <DivisionTile
          key={d.group}
          index={i}
          short={d.short}
          cost={d.cost}
          pct={grand > 0 ? (d.cost / grand) * 100 : 0}
          barPct={max > 0 ? (d.cost / max) * 100 : 0}
          color={d.color}
          items={d.items}
          mounted={mounted}
          open={open.has(d.group)}
          onToggle={() => toggle(d.group)}
        />
      ))}
    </div>
  );
}

function DivisionTile({
  index,
  short,
  cost,
  pct,
  barPct,
  color,
  items,
  mounted,
  open,
  onToggle,
}: {
  index: number;
  short: string;
  cost: number;
  pct: number;
  barPct: number;
  color: string;
  items: LineItem[];
  mounted: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const shown = useCountUp(cost, { duration: 400, mountDuration: 800 });

  return (
    <div
      className="row-in overflow-hidden rounded-xl border border-card bg-surface shadow-sm transition-shadow hover:shadow-md"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <button type="button" onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{short}</span>
          <span className="shrink-0 rounded-full bg-panel px-2 py-0.5 text-xs font-medium tabular-nums text-muted">
            {pct.toFixed(1)}%
          </span>
        </div>
        <div className="mt-2 font-display text-2xl font-light tabular-nums text-ink">
          {formatUSDCompact(shown)}
        </div>
        {/* Mini share bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel">
          <div
            className="h-full rounded-full"
            style={{
              width: mounted ? `${barPct}%` : "0%",
              backgroundColor: color,
              transition: "width 500ms cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
        <div className="mt-2 flex items-center gap-1 text-xs text-muted">
          <Chevron open={open} />
          <span>{open ? "Hide line items" : `${items.length} line items`}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-card">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="row-in flex items-baseline gap-3 border-t border-card/50 px-4 py-2 text-sm first:border-t-0"
              style={{ animationDelay: `${idx * 25}ms` }}
            >
              <span className="flex-1 text-ink">{item.label}</span>
              <span className="hidden text-xs text-muted sm:block">{item.basis}</span>
              <span className="w-24 shrink-0 text-right tabular-nums text-ink">
                {formatUSD(item.cost)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-90" : ""}`}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M7 5l6 5-6 5V5z" />
    </svg>
  );
}
