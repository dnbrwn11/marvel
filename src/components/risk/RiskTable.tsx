// RiskTable — the editable register. One row per risk: number, title, category,
// tier badge, a live probability SLIDER (1–5), impact (static range, or the
// parametric deltaLabel + its LIVE engine-priced dollar figure in teal), and a
// status pill that cycles Open → Mitigating → Retired on click. Rows expand to an
// editable owner + mitigation textarea. Probability, status, and mitigation edits
// flow up to the parent, which persists them to localStorage. Retired rows strike
// through and are dropped from every rollup by the exposure math.

import { useState } from "react";
import { colors } from "../../brand/tokens";
import { formatUSDCompact } from "../shared/currency";
import type {
  Risk,
  RiskPrice,
  RiskStatus,
  RiskTier,
} from "../../model/riskRegister";

const TIER_BADGE: Record<RiskTier, string> = {
  GMP: "border-teal/40 bg-teal/10 text-teal",
  Owner: "border-orange/40 bg-orange/10 text-orange",
  Shared: "border-purple/40 bg-purple/10 text-purple",
};

const STATUS_PILL: Record<RiskStatus, string> = {
  Open: "border-magenta/40 bg-magenta/10 text-magenta",
  Mitigating: "border-orange/40 bg-orange/10 text-orange",
  Retired: "border-card bg-panel text-muted",
};

export function RiskTable({
  risks,
  prices,
  onProbability,
  onCycleStatus,
  onMitigation,
}: {
  risks: Risk[];
  prices: Map<string, RiskPrice>;
  onProbability: (id: string, p: 1 | 2 | 3 | 4 | 5) => void;
  onCycleStatus: (id: string) => void;
  onMitigation: (id: string, text: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-card bg-surface shadow-sm">
      <div className="border-b border-card px-6 py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-teal">
          Risk Register
        </div>
        <p className="mt-1 text-xs text-muted">
          Drag probability to re-weight exposure live · click a status pill to cycle
          Open → Mitigating → Retired · click a row to edit owner &amp; mitigation
        </p>
      </div>

      {/* Column header (hidden on small screens) */}
      <div className="hidden grid-cols-[2.5rem_1fr_7rem_5rem_9rem_10rem_6.5rem] items-center gap-3 border-b border-card bg-panel/50 px-6 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted lg:grid">
        <span>#</span>
        <span>Risk</span>
        <span>Category</span>
        <span>Tier</span>
        <span>Probability</span>
        <span>Impact</span>
        <span>Status</span>
      </div>

      <div className="divide-y divide-card">
        {risks.map((risk) => {
          const price = prices.get(risk.id);
          const retired = risk.status === "Retired";
          const isOpen = expanded === risk.id;
          return (
            <div key={risk.id} className={retired ? "opacity-60" : ""}>
              {/* Main row */}
              <div className="grid grid-cols-[2.5rem_1fr] items-center gap-3 px-6 py-3 lg:grid-cols-[2.5rem_1fr_7rem_5rem_9rem_10rem_6.5rem]">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : risk.id)}
                  className="text-left font-display text-sm font-semibold tabular-nums text-muted hover:text-teal"
                  title={isOpen ? "Collapse" : "Expand"}
                >
                  {risk.num}
                </button>

                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : risk.id)}
                  className="min-w-0 text-left"
                >
                  <span
                    className={[
                      "block text-sm leading-snug text-ink",
                      retired ? "line-through" : "",
                    ].join(" ")}
                  >
                    {risk.title}
                  </span>
                  {/* Compact meta on small screens */}
                  <span className="mt-1 flex flex-wrap items-center gap-1.5 lg:hidden">
                    <TierBadge tier={risk.tier} />
                    <span className="text-[11px] text-muted">{risk.category}</span>
                  </span>
                </button>

                <span className="hidden text-xs text-muted lg:block">
                  {risk.category}
                </span>

                <span className="hidden lg:block">
                  <TierBadge tier={risk.tier} />
                </span>

                {/* Probability slider */}
                <div className="col-span-2 lg:col-span-1">
                  <ProbabilitySlider
                    value={risk.probability}
                    disabled={retired}
                    onChange={(p) => onProbability(risk.id, p)}
                  />
                </div>

                {/* Impact */}
                <div className="col-span-2 text-xs lg:col-span-1">
                  {risk.impact.kind === "static" ? (
                    <span className="tabular-nums text-ink">
                      {price
                        ? `${formatUSDCompact(price.low)}–${formatUSDCompact(price.high)}`
                        : "—"}
                    </span>
                  ) : (
                    <span className="flex flex-col">
                      <span className="text-muted">{risk.impact.deltaLabel}</span>
                      <span className="font-display font-semibold tabular-nums text-teal">
                        {price ? `+${formatUSDCompact(price.mid)}` : "—"}
                        {price && !price.seasonMeets && (
                          <span className="ml-1 text-[10px] font-semibold text-coral">
                            season at risk
                          </span>
                        )}
                      </span>
                    </span>
                  )}
                </div>

                {/* Status pill */}
                <div className="col-span-2 lg:col-span-1">
                  <button
                    type="button"
                    onClick={() => onCycleStatus(risk.id)}
                    className={[
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      STATUS_PILL[risk.status],
                    ].join(" ")}
                    title="Click to cycle status"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: statusDot(risk.status) }}
                    />
                    {risk.status}
                  </button>
                </div>
              </div>

              {/* Expanded: owner + mitigation */}
              {isOpen && (
                <div className="row-in border-t border-card bg-panel/40 px-6 py-4">
                  <div className="grid gap-4 md:grid-cols-[12rem_1fr]">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                        Owner
                      </div>
                      <div className="mt-1 text-sm text-ink">{risk.owner}</div>
                      {risk.impact.kind === "parametric" && (
                        <div className="mt-3">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            Parametric lever
                          </div>
                          <div className="mt-1 text-xs text-teal">
                            {risk.impact.deltaLabel}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                          Mitigation (editable · persists)
                        </span>
                        <textarea
                          value={risk.mitigation}
                          onChange={(e) => onMitigation(risk.id, e.target.value)}
                          rows={3}
                          className="mt-1.5 w-full resize-y rounded-lg border border-card bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-teal/50"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusDot(status: RiskStatus): string {
  return status === "Open"
    ? colors.magenta
    : status === "Mitigating"
      ? colors.orange
      : colors.muted;
}

function TierBadge({ tier }: { tier: RiskTier }) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        TIER_BADGE[tier],
      ].join(" ")}
    >
      {tier}
    </span>
  );
}

// Probability 1–5 slider — teal fill mirrors the existing Slider control.
function ProbabilitySlider({
  value,
  disabled,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  disabled: boolean;
  onChange: (p: 1 | 2 | 3 | 4 | 5) => void;
}) {
  const pct = ((value - 1) / 4) * 100;
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={1}
        max={5}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
        aria-label="Probability 1 to 5"
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none accent-teal disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          background: `linear-gradient(to right, var(--color-teal) 0%, var(--color-teal) ${pct}%, var(--color-card) ${pct}%, var(--color-card) 100%)`,
        }}
      />
      <span className="w-8 shrink-0 text-right font-display text-xs font-semibold tabular-nums text-teal">
        P{value}
      </span>
    </div>
  );
}
