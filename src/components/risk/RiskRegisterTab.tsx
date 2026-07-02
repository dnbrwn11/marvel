// ─────────────────────────────────────────────────────────────────────────────
// RiskRegisterTab — the fifth tab. Orchestrates the Risk Register:
//   A. Header strip (GMP / Owner weighted exposure + open-risk count)
//   B. Stress Test mode (master switch + per-risk realize → one LOCAL shadow run)
//   C. Exposure tornado (weighted exposure by risk, live-repricing)
//   D. Editable register table (probability slider, status cycle, mitigation)
//   E. Footer note
//
// STRICTLY ADDITIVE. Reads the single source of truth from useArena() (inputs,
// rates, and the already-computed baseline model). Parametric impacts are priced
// ONLY by re-running the existing computeModel via priceRisk(). Stress state is a
// LOCAL shadow computation — it never calls setInput, so it can never leak into
// the shared inputs or any other tab.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import { useArena } from "../../state/ArenaModelContext";
import { computeModel, scheduleOutcome } from "../../model/arenaCostModel";
import {
  applyDelta,
  clearRiskOverrides,
  composeDeltas,
  mergeRisks,
  priceRisk,
  readRiskOverrides,
  rollupByTier,
  writeRiskOverrides,
} from "../../model/riskRegister";
import type {
  RiskOverride,
  RiskOverrideMap,
  RiskPrice,
} from "../../model/riskRegister";
import type { Inputs } from "../../model/types";
import { Tricolor } from "../shared/Tricolor";
import { HeaderStrip } from "./HeaderStrip";
import { StressControls, StressedBanner } from "./StressTest";
import { ExposureTornado } from "./ExposureTornado";
import { RiskTable } from "./RiskTable";

// Ephemeral, SESSION-ONLY stress state. Held in module scope (not localStorage,
// not the shared inputs) so it survives this tab unmounting/remounting when the
// user switches tabs — the acceptance requires stress state to persist until
// toggled off — while never leaking into any other tab or being persisted.
let sessionStressOn = false;
let sessionRealized = new Set<string>();

export function RiskRegisterTab() {
  const { inputs, rates, model } = useArena();

  // Persisted user edits (probability / status / mitigation) only. Structural
  // fields are always re-seeded from code via mergeRisks().
  const [overrides, setOverrides] = useState<RiskOverrideMap>(() =>
    readRiskOverrides(),
  );

  // Ephemeral stress state — NEVER persisted, NEVER written to shared inputs.
  // Seeded from the module-scope session store so it survives tab switches.
  const [stressOn, setStressOn] = useState(() => sessionStressOn);
  const [realized, setRealized] = useState<Set<string>>(
    () => new Set(sessionRealized),
  );

  const risks = useMemo(() => mergeRisks(overrides), [overrides]);

  // Baseline escalated total = the shared model's escalated total (already the
  // computeModel run on the live inputs+rates). Passed to priceRisk so N risks
  // don't each recompute the baseline. Memoization: prices recompute only when
  // the live inputs, rates, or the register structure change.
  const baselineEscalated = model.constructionCostEscalated;
  const prices = useMemo(() => {
    const map = new Map<string, RiskPrice>();
    for (const r of risks) {
      map.set(r.id, priceRisk(r, inputs, rates, baselineEscalated));
    }
    return map;
  }, [risks, inputs, rates, baselineEscalated]);

  const entries = useMemo(
    () => risks.map((r) => ({ risk: r, price: prices.get(r.id)! })),
    [risks, prices],
  );

  const rollup = useMemo(() => rollupByTier(entries), [entries]);

  const counts = useMemo(() => {
    let open = 0;
    let mitigating = 0;
    let retired = 0;
    for (const r of risks) {
      if (r.status === "Open") open++;
      else if (r.status === "Mitigating") mitigating++;
      else retired++;
    }
    return { open, mitigating, retired };
  }, [risks]);

  // ── Stress shadow run ──────────────────────────────────────────────────────
  // Compose the realized parametric deltas onto the LIVE inputs and run
  // computeModel ONCE on that local shadow. scheduleOutcome gives the stressed
  // season flag from the engine's own logic (not reimplemented).
  const realizedParametric = risks.filter(
    (r) =>
      realized.has(r.id) &&
      r.impact.kind === "parametric" &&
      r.status !== "Retired",
  );
  const stressActive = stressOn && realizedParametric.length > 0;

  const stressed = useMemo(() => {
    if (!stressActive) return null;
    const deltas = realizedParametric.map((r) =>
      r.impact.kind === "parametric" ? r.impact.inputsDelta : {},
    );
    const shadowInputs: Inputs = applyDelta(inputs, composeDeltas(deltas));
    const result = computeModel(shadowInputs, rates);
    return {
      escalated: result.constructionCostEscalated,
      seasonMeets: scheduleOutcome(shadowInputs.constructionStartMonth).meets,
      count: realizedParametric.length,
    };
    // realizedParametric derives from realized+risks; keyed on those + engine args.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stressActive, realized, risks, inputs, rates]);

  // ── Edit handlers (persist the override map) ───────────────────────────────
  const patchOverride = useCallback((id: string, patch: RiskOverride) => {
    setOverrides((prev) => {
      const next: RiskOverrideMap = {
        ...prev,
        [id]: { ...prev[id], ...patch },
      };
      writeRiskOverrides(next);
      return next;
    });
  }, []);

  const onProbability = useCallback(
    (id: string, p: 1 | 2 | 3 | 4 | 5) => patchOverride(id, { probability: p }),
    [patchOverride],
  );

  const onCycleStatus = useCallback(
    (id: string) => {
      const current = risks.find((r) => r.id === id);
      if (!current) return;
      const next =
        current.status === "Open"
          ? "Mitigating"
          : current.status === "Mitigating"
            ? "Retired"
            : "Open";
      patchOverride(id, { status: next });
      // A newly-retired risk can't stay "realized" in the stress scenario.
      if (next === "Retired") {
        setRealized((prev) => {
          if (!prev.has(id)) return prev;
          const copy = new Set(prev);
          copy.delete(id);
          sessionRealized = copy;
          return copy;
        });
      }
    },
    [risks, patchOverride],
  );

  const onMitigation = useCallback(
    (id: string, text: string) => patchOverride(id, { mitigation: text }),
    [patchOverride],
  );

  const onToggleRealize = useCallback((id: string) => {
    setRealized((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      sessionRealized = copy;
      return copy;
    });
  }, []);

  const onToggleStress = useCallback((on: boolean) => {
    sessionStressOn = on;
    setStressOn(on);
    if (!on) {
      sessionRealized = new Set();
      setRealized(new Set()); // master off → revert instantly
    }
  }, []);

  const onReset = useCallback(() => {
    clearRiskOverrides();
    setOverrides({});
    sessionStressOn = false;
    sessionRealized = new Set();
    setStressOn(false);
    setRealized(new Set());
  }, []);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      {/* Persistent framing banner — visible on this tab (also the global footer) */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal/30 bg-teal/5 px-4 py-3">
        <p className="text-xs text-ink">
          <span className="font-semibold text-teal">Concept-level parametric model</span>{" "}
          — planning assumptions, not an estimate. Parametric impacts are priced
          live by the program cost engine.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="shrink-0 rounded-full border border-card bg-surface px-3 py-1 text-xs font-semibold text-muted transition-colors hover:border-teal/40 hover:text-teal"
        >
          Reset register to defaults
        </button>
      </div>

      {/* Section title */}
      <div>
        <h2 className="font-display text-2xl font-light text-ink">Risk Register</h2>
        <p className="mt-1 text-sm text-muted">
          Probability-weighted exposure across GMP and Owner tiers, with live
          engine-priced parametric stress testing.
        </p>
      </div>

      {/* B (banner) — sticky stressed-model card, only while stress is active */}
      {stressed && (
        <StressedBanner
          stressedEscalated={stressed.escalated}
          baselineEscalated={baselineEscalated}
          seasonMeets={stressed.seasonMeets}
          realizedCount={stressed.count}
        />
      )}

      {/* A — header KPI strip */}
      <HeaderStrip
        gmpExposure={rollup.gmp}
        ownerExposure={rollup.owner}
        contingency={model.contingency}
        openCount={counts.open}
        mitigatingCount={counts.mitigating}
        retiredCount={counts.retired}
      />

      {/* B (controls) — stress test master switch + realize toggles */}
      <StressControls
        stressOn={stressOn}
        onToggleStress={onToggleStress}
        risks={risks}
        prices={prices}
        realized={realized}
        onToggleRealize={onToggleRealize}
      />

      {/* C — exposure tornado */}
      <ExposureTornado entries={entries} />

      {/* D — editable register table */}
      <RiskTable
        risks={risks}
        prices={prices}
        onProbability={onProbability}
        onCycleStatus={onCycleStatus}
        onMitigation={onMitigation}
      />

      <Tricolor className="rounded-full" />

      {/* E — footer note */}
      <p className="pb-2 text-center text-xs text-muted">
        Impact ranges are planning-grade placeholders for precon calibration.
        Parametric impacts are priced live by the program cost engine.
      </p>
    </div>
  );
}

// Convenience default export mirrors the other tab components' import style.
export default RiskRegisterTab;
