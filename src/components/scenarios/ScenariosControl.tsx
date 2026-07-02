// ScenariosControl — the "Scenarios" entry point for the Program & Cost header.
// A single self-contained button that opens a dialog to: Save Current (name +
// optional note), list saved scenarios with delete, and Compare a scenario against
// the RFP baseline. Reads the CURRENT live inputs from the shared model context so
// "Save Current" snapshots exactly what the user has dialed in. Purely additive:
// no existing tab logic or engine code is touched.

import { useEffect, useState } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { DEFAULT_INPUTS } from "../../model/arenaCostModel";
import { useScenarios } from "../../scenarios/useScenarios";
import { ScenarioCompare } from "./ScenarioCompare";

function formatCreated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function ScenariosControl() {
  const { inputs } = useArena();
  const { scenarios, save, remove } = useScenarios();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [compareId, setCompareId] = useState<string | null>(null);

  // The scenario currently being compared; null when it was deleted or none chosen.
  const compareScenario = scenarios.find((s) => s.id === compareId) ?? null;

  // Close on Escape while the dialog is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (compareId) setCompareId(null);
        else setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, compareId]);

  const onSave = () => {
    if (!name.trim()) return;
    save(name, note, inputs);
    setName("");
    setNote("");
  };

  const onDelete = (id: string) => {
    if (id === compareId) setCompareId(null); // leaving compare so it can't crash
    remove(id);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-2 rounded-lg border border-card bg-surface px-4 py-2 text-sm font-medium text-ink shadow-sm transition-colors hover:bg-panel"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <rect x="3" y="3" width="6" height="14" rx="1.5" />
          <rect x="11" y="3" width="6" height="9" rx="1.5" />
        </svg>
        Scenarios
        {scenarios.length > 0 && (
          <span className="ml-0.5 rounded-full bg-teal/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-teal">
            {scenarios.length}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm sm:p-8"
          role="dialog"
          aria-modal="true"
          aria-label="Scenarios"
          onClick={() => (compareId ? setCompareId(null) : setOpen(false))}
        >
          <div
            className="my-auto w-full max-w-3xl rounded-2xl border border-card bg-surface shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog header */}
            <div className="flex items-center justify-between gap-4 border-b border-card px-5 py-4">
              <div className="flex items-center gap-3">
                {compareScenario && (
                  <button
                    type="button"
                    onClick={() => setCompareId(null)}
                    className="rounded-md border border-card px-2 py-1 text-xs font-medium text-muted transition-colors hover:bg-panel"
                  >
                    ← Back
                  </button>
                )}
                <h2 className="font-display text-lg font-light text-ink">
                  {compareScenario ? "Compare" : "Scenarios"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="rounded-md p-1 text-muted transition-colors hover:bg-panel hover:text-ink"
              >
                <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-5">
              {compareScenario ? (
                <ScenarioCompare baselineInputs={DEFAULT_INPUTS} scenario={compareScenario} />
              ) : compareId ? (
                // Compare was requested but the scenario is gone (deleted). Graceful.
                <div className="rounded-xl border border-card bg-panel p-6 text-center text-sm text-muted">
                  That scenario is no longer available.
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setCompareId(null)}
                      className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:brightness-95"
                    >
                      Back to scenarios
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Save Current */}
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-teal">Save current program</h3>
                    <p className="mt-1 text-xs text-muted">
                      Snapshots the inputs you have dialed in now. Numbers are always re-derived from these inputs.
                    </p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">Name</span>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && onSave()}
                          placeholder="e.g. Value-engineered"
                          className="w-full rounded-lg border border-card bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                        />
                      </label>
                      <label className="block">
                        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">Note (optional)</span>
                        <input
                          type="text"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && onSave()}
                          placeholder="What changed & why"
                          className="w-full rounded-lg border border-card bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={onSave}
                        disabled={!name.trim()}
                        className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Save Current
                      </button>
                    </div>
                  </section>

                  {/* Saved list */}
                  <section>
                    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-teal">
                      Saved scenarios{scenarios.length > 0 ? ` (${scenarios.length})` : ""}
                    </h3>
                    {scenarios.length === 0 ? (
                      <div className="mt-3 rounded-xl border border-dashed border-card bg-panel p-6 text-center text-sm text-muted">
                        No saved scenarios yet. Save the current program above to compare it against the RFP baseline.
                      </div>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {scenarios.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-card bg-surface p-3"
                          >
                            <div className="min-w-0">
                              <div className="truncate font-display text-sm font-medium text-ink">{s.name}</div>
                              {s.note && <div className="truncate text-xs text-muted">{s.note}</div>}
                              <div className="mt-0.5 text-[11px] text-muted">Saved {formatCreated(s.createdAt)}</div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCompareId(s.id)}
                                className="rounded-lg bg-teal px-3 py-1.5 text-xs font-medium text-white transition-colors hover:brightness-95"
                              >
                                Compare
                              </button>
                              <button
                                type="button"
                                onClick={() => onDelete(s.id)}
                                aria-label={`Delete ${s.name}`}
                                className="rounded-lg border border-card px-2.5 py-1.5 text-xs font-medium text-muted transition-colors hover:border-magenta/40 hover:bg-magenta/10 hover:text-magenta"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
