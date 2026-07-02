// useScenarios — React state wrapper around the localStorage scenario store.
// Seeds on first load (via initScenarios), persists on every mutation, and exposes
// a small save / remove API. Persists INPUTS ONLY (see scenarioStore.ts).

import { useCallback, useState } from "react";
import type { Inputs } from "../model/types";
import { initScenarios, makeScenario, writeStored } from "./scenarioStore";
import type { Scenario } from "./scenarioStore";

export interface UseScenarios {
  scenarios: Scenario[];
  save: (name: string, note: string, inputs: Inputs) => void;
  remove: (id: string) => void;
}

export function useScenarios(): UseScenarios {
  // Initializer runs once per mount; if it seeds, that write persists so a
  // StrictMode double-mount re-reads the existing array instead of duplicating.
  const [scenarios, setScenarios] = useState<Scenario[]>(() => initScenarios());

  const save = useCallback((name: string, note: string, inputs: Inputs) => {
    setScenarios((prev) => {
      const next = [...prev, makeScenario(name, note, inputs)];
      writeStored(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setScenarios((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeStored(next);
      return next;
    });
  }, []);

  return { scenarios, save, remove };
}
