// ProgramAndCost — a cost workspace, not a form. The persistent cost command bar
// anchors the top (sticky); the arena's cost structure — a grid of explorable
// division tiles — is the hero content and owns the width. Program inputs live in
// a collapsible drawer (collapsed by default) that slides out from the left and
// pushes the tiles aside, so dragging a control animates the command bar and tiles
// live. Same engine + useArenaModel hook via context — layout/interaction only.

import { useState } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { CostCommandBar } from "./CostCommandBar";
import { ProgramDrawer } from "./ProgramDrawer";
import { DivisionTiles } from "./DivisionTiles";

export function ProgramAndCost() {
  const { model } = useArena();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      {/* Anchor */}
      <CostCommandBar />

      {/* Section header + drawer toggle */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <h2 className="font-display text-lg font-light text-ink">
          Cost structure by division
        </h2>
        <button
          type="button"
          onClick={() => setDrawerOpen((o) => !o)}
          aria-expanded={drawerOpen}
          className="flex shrink-0 items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-95"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M4 6h9M4 10h12M4 14h7" strokeLinecap="round" />
            <circle cx="15" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="8" cy="14" r="2" fill="currentColor" stroke="none" />
          </svg>
          {drawerOpen ? "Close controls" : "Adjust program"}
        </button>
      </div>

      {/* Drawer (left) + hero tiles (fill) */}
      <div className="mt-4 flex items-start">
        <ProgramDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        <div className="min-w-0 flex-1">
          <DivisionTiles model={model} />
        </div>
      </div>
    </div>
  );
}
