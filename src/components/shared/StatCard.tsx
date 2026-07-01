// StatCard — a clean light card for a secondary metric (label + value + hint).
// Used for the Cost Summary secondary stats and reusable anywhere a KPI is shown.

import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  /** Optional accent bar color (defaults to muted card border). */
  accent?: string;
}

export function StatCard({ label, value, hint, accent }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-card bg-surface p-5 shadow-sm transition-shadow duration-200 hover:shadow-md">
      {accent && (
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className="mt-2 font-display text-3xl font-light tabular-nums text-ink">
        {value}
      </div>
      {hint && <div className="mt-1 text-sm text-muted">{hint}</div>}
    </div>
  );
}
