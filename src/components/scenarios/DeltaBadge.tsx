// DeltaBadge — a GAP-brand rounded pill showing a delta value + label. Tone maps
// to the brand palette: teal for positive/neutral deltas, magenta for negative,
// orange for the schedule badge. Matches the app's Tailwind design language
// (the tinted border/bg/text pattern used by the existing SeasonFlag chip).

import type { ReactNode } from "react";

export type BadgeTone = "pos" | "neg" | "schedule";

const TONE: Record<BadgeTone, string> = {
  pos: "border-teal/30 bg-teal/10 text-teal",
  neg: "border-magenta/30 bg-magenta/10 text-magenta",
  schedule: "border-orange/40 bg-orange/10 text-orange",
};

export function DeltaBadge({
  label,
  value,
  tone,
  sub,
}: {
  label: string;
  value: string;
  tone: BadgeTone;
  sub?: ReactNode;
}) {
  return (
    <div className={`inline-flex min-w-[9rem] flex-col rounded-2xl border px-4 py-2.5 ${TONE[tone]}`}>
      <span className="font-display text-lg font-semibold leading-none tabular-nums">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </span>
      {sub && <span className="mt-2">{sub}</span>}
    </div>
  );
}
