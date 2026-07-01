// ─────────────────────────────────────────────────────────────────────────────
// useArenaModel — THE ONE SOURCE OF TRUTH
//
// Holds the Inputs state (init from DEFAULT_INPUTS) AND the editable unit-rate
// table (init from a copy of RATES), exposes setInput(key,value) and
// setRate(key,value), and derives — memoized — the full model via
// computeModel(inputs, rates) and the phasing via computePhasing(). EVERY tab
// reads `model` / `phasing` from this hook. No component calls the engine directly
// or keeps its own copy of inputs/rates. That guarantee keeps all views consistent.
// ─────────────────────────────────────────────────────────────────────────────

import { useCallback, useMemo, useState } from "react";
import {
  computeModel,
  computePhasing,
  DEFAULT_INPUTS,
  RATES,
} from "../model/arenaCostModel";
import type { Rates } from "../model/arenaCostModel";
import type { Inputs, ModelResult, Phasing } from "../model/types";

export interface ArenaModel {
  inputs: Inputs;
  setInput: <K extends keyof Inputs>(key: K, value: Inputs[K]) => void;
  reset: () => void;
  rates: Rates;
  setRate: <K extends keyof Rates>(key: K, value: Rates[K]) => void;
  resetRates: () => void;
  model: ModelResult;
  phasing: Phasing;
}

export function useArenaModel(initial: Inputs = DEFAULT_INPUTS): ArenaModel {
  const [inputs, setInputs] = useState<Inputs>(initial);
  // Editable unit rates — a copy of the RATES defaults, so edits never mutate the
  // baseline (which stays available for "Reset to defaults").
  const [rates, setRates] = useState<Rates>(() => ({ ...RATES }));

  const setInput = useCallback(
    <K extends keyof Inputs>(key: K, value: Inputs[K]) => {
      setInputs((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const reset = useCallback(() => setInputs(initial), [initial]);

  const setRate = useCallback(
    <K extends keyof Rates>(key: K, value: Rates[K]) => {
      setRates((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetRates = useCallback(() => setRates({ ...RATES }), []);

  // Derived, memoized on inputs + rates — the single computed truth for every view.
  const model = useMemo(() => computeModel(inputs, rates), [inputs, rates]);
  const phasing = useMemo(() => computePhasing(model), [model]);

  return { inputs, setInput, reset, rates, setRate, resetRates, model, phasing };
}
