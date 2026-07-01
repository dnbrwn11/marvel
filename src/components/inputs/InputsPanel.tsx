// InputsPanel — the program input controls (left column of the Program & Cost
// tab). Every control is bound to the Inputs interface through setInput() from
// the single-source-of-truth hook (via ArenaModelContext). Controls are grouped
// into labeled sections with teal section labels; active toggles fill teal.
// Layout-agnostic: renders a vertical stack of section cards so it drops cleanly
// into the ~40% left column (and stacks on top on narrow screens).

import type { ReactNode } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { monthLabel, scheduleOutcome } from "../../model/arenaCostModel";
import { Slider } from "./controls/Slider";
import { SegmentedToggle } from "./controls/SegmentedToggle";
import { Switch } from "./controls/Switch";

export function InputsPanel() {
  const { inputs, setInput } = useArena();

  return (
    <div className="space-y-5">
      {/* Seating & Premium — building program drivers */}
      <Section title="Seating & Premium">
          <Slider
            label="Fixed seats"
            value={inputs.seats}
            min={12000}
            max={22000}
            step={100}
            onChange={(v) => setInput("seats", v)}
          />
          <Slider
            label="Building area"
            value={inputs.gsf}
            min={550000}
            max={1000000}
            step={5000}
            unit="GSF"
            onChange={(v) => setInput("gsf", v)}
          />
          <Slider
            label="Premium suites"
            value={inputs.suites}
            min={20}
            max={80}
            step={1}
            onChange={(v) => setInput("suites", v)}
          />
          <Slider
            label="Club seats"
            value={inputs.clubSeats}
            min={800}
            max={4000}
            step={50}
            onChange={(v) => setInput("clubSeats", v)}
          />
          <Slider
            label="Premium program size"
            value={inputs.premiumPct}
            min={5}
            max={25}
            step={1}
            unit="% of GSF"
            onChange={(v) => setInput("premiumPct", v)}
          />
          <SegmentedToggle
            label="Façade tier"
            value={inputs.facadeTier}
            onChange={(v) => setInput("facadeTier", v)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "signature", label: "Signature" },
            ]}
          />
        </Section>

        {/* Technology */}
        <Section title="Technology">
          <SegmentedToggle
            label="Technology tier"
            value={inputs.techTier}
            onChange={(v) => setInput("techTier", v)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "flagship", label: "Flagship" },
            ]}
          />
          <SegmentedToggle
            label="Scoreboard tier"
            value={inputs.scoreboardTier}
            onChange={(v) => setInput("scoreboardTier", v)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "premium", label: "Premium" },
              { value: "marquee", label: "Marquee" },
            ]}
          />
          <SegmentedToggle
            label="LED ribbon boards"
            value={inputs.ribbonBoards}
            onChange={(v) => setInput("ribbonBoards", v)}
            options={[
              { value: 2, label: "2 boards" },
              { value: 3, label: "3 boards" },
            ]}
          />
          <Switch
            label="Ice capability"
            hint="NHL/AHL refrigeration, dehumidification & floor"
            checked={inputs.iceCapable}
            onChange={(v) => setInput("iceCapable", v)}
          />
        </Section>

        {/* Parking & Site */}
        <Section title="Parking & Site">
          <Slider
            label="Parking stalls"
            value={inputs.parkingStalls}
            min={0}
            max={5000}
            step={50}
            onChange={(v) => setInput("parkingStalls", v)}
          />
          <Slider
            label="Structured parking"
            value={inputs.structuredParkingPct}
            min={0}
            max={100}
            step={5}
            unit="% structured"
            onChange={(v) => setInput("structuredParkingPct", v)}
          />
          <SegmentedToggle
            label="Site complexity"
            value={inputs.siteComplexity}
            onChange={(v) => setInput("siteComplexity", v)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </Section>

        {/* Cost Assumptions */}
        <Section title="Cost Assumptions">
          <Slider
            label="Construction start"
            value={inputs.constructionStartMonth}
            min={2027 * 12}
            max={2031 * 12}
            step={1}
            format={(v) => monthLabel(v)}
            onChange={(v) => setInput("constructionStartMonth", v)}
          />
          <Slider
            label="Annual escalation rate"
            value={inputs.annualEscalationRate}
            min={0}
            max={8}
            step={0.25}
            unit="%/yr"
            format={(v) => v.toFixed(2)}
            onChange={(v) => setInput("annualEscalationRate", v)}
          />
          <ScheduleOutcome startMonth={inputs.constructionStartMonth} />
          <SegmentedToggle
            label="LEED / sustainability tier"
            value={inputs.leedTier}
            onChange={(v) => setInput("leedTier", v)}
            options={[
              { value: "none", label: "None" },
              { value: "silver", label: "Silver" },
              { value: "gold", label: "Gold" },
              { value: "platinum", label: "Platinum" },
            ]}
          />
          <p className="text-xs leading-relaxed text-muted">
            GCs, fee, contingency, precon &amp; bond use GAP's submitted GMP rates
            ({inputs.gcGrPct}% / {inputs.feePct}% / {inputs.contingencyPct}% /{" "}
            {inputs.preconFeePct}% / {inputs.bondPct}%) and are fixed for this phase.
          </p>
        </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-card bg-surface p-6 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-teal">
        {title}
      </h2>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

// Schedule-outcome readout: substantial completion date + NBA-season status flag.
function ScheduleOutcome({ startMonth }: { startMonth: number }) {
  const o = scheduleOutcome(startMonth);
  return (
    <div
      className={[
        "rounded-lg border px-3 py-2 text-xs font-medium leading-snug",
        o.meets
          ? "border-teal/30 bg-teal/10 text-teal"
          : "border-orange/40 bg-orange/10 text-orange",
      ].join(" ")}
    >
      {o.meets
        ? `✓ Substantial completion ${o.scLabel} — meets 2030-31 NBA season target`
        : `⚠ Completes ${o.scLabel} — misses 2030-31 season`}
    </div>
  );
}
