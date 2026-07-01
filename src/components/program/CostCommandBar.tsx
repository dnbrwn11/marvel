// CostCommandBar — the persistent anchor at the top of the Program & Cost tab.
// Sticky, full-width strip: the escalated-cost hero (count-animated), the
// "where the money is" segmented division bar, and the key stats (cost/seat,
// cost/GSF, hard cost, today's dollars). Reads the shared hook, so it updates
// live while a control is dragged in the drawer. Styling/animation only.

import { useArena } from "../../state/ArenaModelContext";
import { Tricolor } from "../shared/Tricolor";
import { useCountUp } from "../shared/useCountUp";
import { formatUSD, formatUSDCompact } from "../shared/currency";
import { colors } from "../../brand/tokens";
import { StackedCostBar } from "../summary/StackedCostBar";

export function CostCommandBar() {
  const { inputs, model } = useArena();
  const hero = useCountUp(model.constructionCostEscalated, {
    duration: 400,
    mountDuration: 1000,
  });
  const escPct =
    model.constructionCostToday > 0
      ? (model.escalation / model.constructionCostToday) * 100
      : 0;

  return (
    <div className="sticky top-0 z-20 rounded-2xl border border-card bg-surface/95 p-5 shadow-md backdrop-blur">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        {/* Hero */}
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Escalated construction cost
          </div>
          <div className="mt-1 font-display text-4xl font-light tabular-nums tracking-tight text-teal sm:text-5xl">
            {formatUSD(hero)}
          </div>
          <div className="mt-0.5 text-xs text-muted">
            includes {escPct.toFixed(1)}% escalation · {formatUSD(model.escalation)}
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Chip label="Cost / seat" value={model.costPerSeat} format={formatUSD} accent={colors.orange} />
          <Chip label="Cost / GSF" value={model.constructionCostEscalated / inputs.gsf} format={formatUSD} accent={colors.purple} />
          <Chip label="Hard cost" value={model.hardCost} format={formatUSDCompact} accent={colors.coral} />
          <Chip label="Today's $" value={model.constructionCostToday} format={formatUSDCompact} accent={colors.magenta} />
        </div>
      </div>

      <Tricolor className="my-4 rounded-full" />

      <StackedCostBar model={model} />
    </div>
  );
}

function Chip({
  label,
  value,
  format,
  accent,
}: {
  label: string;
  value: number;
  format: (n: number) => string;
  accent: string;
}) {
  const shown = useCountUp(value, { duration: 400, mountDuration: 900 });
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
          {label}
        </span>
      </div>
      <div className="mt-0.5 font-display text-lg font-light tabular-nums text-ink">
        {format(shown)}
      </div>
    </div>
  );
}
