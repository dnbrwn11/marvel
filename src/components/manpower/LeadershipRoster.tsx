// LeadershipRoster — GAP's named, committed management team (from staffingData).
// Secondary section below the craft curve. Principals highlighted; clean grid.

import { STAFFING } from "../../model/staffingData";
import { colors } from "../../brand/tokens";

export function LeadershipRoster() {
  return (
    <div className="rounded-xl border border-card bg-surface p-6 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wider text-teal">
        GAP management team
      </div>
      <p className="mb-5 mt-1 text-xs text-muted">
        Management team per GAP Partners submitted RFP response.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STAFFING.keyRoles.map((r) => (
          <div
            key={r.name}
            className="flex items-center gap-3 rounded-lg border border-card bg-panel/40 p-3"
          >
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
              style={{ backgroundColor: r.lead ? colors.teal : colors.muted }}
            >
              {initials(r.name)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-ink">{r.name}</div>
              <div className="truncate text-xs text-muted">{r.role}</div>
            </div>
            {r.lead && (
              <span className="ml-auto shrink-0 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal">
                Lead
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
