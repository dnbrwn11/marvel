// ProgramDrawer — the collapsible program-inputs panel. Slides out from the left
// (animated max-width + opacity) and pushes the division tiles aside, so dragging
// a control animates the sticky cost command bar and the tiles live beside it.
// Collapsed by default; holds the sliders/toggles (InputsPanel) and the editable
// unit rates (AssumptionsPanel). Layout/interaction only.

import { InputsPanel } from "../inputs/InputsPanel";
import { AssumptionsPanel } from "../inputs/AssumptionsPanel";

export function ProgramDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <div
      aria-hidden={!open}
      className={[
        "shrink-0 overflow-hidden transition-all duration-300 ease-out",
        open ? "mr-6 max-w-[380px] opacity-100" : "max-w-0 opacity-0",
      ].join(" ")}
    >
      <div className="w-[360px]">
        <div className="rounded-2xl border border-card bg-surface shadow-md">
          <div className="flex items-center justify-between border-b border-card px-5 py-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal">
              Adjust program
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close program controls"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-panel hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <div className="max-h-[72vh] space-y-5 overflow-y-auto p-5">
            <InputsPanel />
            <AssumptionsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
