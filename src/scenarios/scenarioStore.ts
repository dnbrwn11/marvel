// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO STORE — localStorage persistence for saved pursuit scenarios.
//
// SINGLE SOURCE OF TRUTH: a scenario persists INPUTS ONLY (the exact object that
// gets passed to computeModel). No computed outputs are ever stored — every
// displayed number is re-derived by running computeModel on these inputs at
// render time (see scenarioMetrics.ts). This module is purely additive: it does
// not import or modify the engine's compute path, only its DEFAULT_INPUTS and the
// CONSTRUCTION_MONTHS constant needed to derive the seed's start date.
// ─────────────────────────────────────────────────────────────────────────────

import { CONSTRUCTION_MONTHS, DEFAULT_INPUTS } from "../model/arenaCostModel";
import type { Inputs } from "../model/types";

export interface Scenario {
  id: string;
  name: string;
  note: string;
  createdAt: string; // ISO timestamp
  inputs: Inputs;    // the ONLY persisted state — outputs are always derived
}

export const STORAGE_KEY = "marvel_scenarios_v1";

// localStorage may be unavailable (SSR, private mode, disabled). Guard every use.
function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function genId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to the manual id */
  }
  return `sc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// Shape guard: keep only well-formed entries with an inputs object so a partially
// corrupt array still yields the valid scenarios instead of crashing consumers.
function isScenario(v: unknown): v is Scenario {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.name === "string" &&
    typeof o.note === "string" &&
    typeof o.createdAt === "string" &&
    !!o.inputs &&
    typeof o.inputs === "object"
  );
}

// Read persisted scenarios. Returns null when the key is UNINITIALIZED or CORRUPT
// (so the caller knows to seed); returns a possibly-empty array when the key holds
// valid JSON (e.g. the user deleted every scenario — respected, not reseeded).
export function readStored(): Scenario[] | null {
  if (!hasStorage()) return null;
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null; // never initialized → first load
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null; // corrupt shape → reseed
    return parsed.filter(isScenario);
  } catch {
    return null; // corrupt JSON → reseed
  }
}

export function writeStored(list: Scenario[]): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota exceeded / private mode — in-memory state still works */
  }
}

// Build a scenario from the CURRENT live inputs. Clones inputs so subsequent live
// edits never mutate the saved snapshot.
export function makeScenario(name: string, note: string, inputs: Inputs): Scenario {
  return {
    id: genId(),
    name: name.trim() || "Untitled scenario",
    note: note.trim(),
    createdAt: new Date().toISOString(),
    inputs: { ...inputs },
  };
}

// The seeded "Public Timeline (2032)" scenario: baseline RFP inputs with the DATE
// INPUT ONLY shifted so the first event (start + CONSTRUCTION_MONTHS) lands
// mid-2032 (Jul 2032). Everything else is exactly DEFAULT_INPUTS.
export function seedScenario(): Scenario {
  const firstEventTarget = 2032 * 12 + 6; // Jul 2032, mid-year
  const inputs: Inputs = {
    ...DEFAULT_INPUTS,
    constructionStartMonth: firstEventTarget - CONSTRUCTION_MONTHS,
  };
  return {
    id: genId(),
    name: "Public Timeline (2032)",
    note: "Baseline program on the publicly reported ~2032 opening — start date shifted so the first event lands mid-2032.",
    createdAt: new Date().toISOString(),
    inputs,
  };
}

// Initialize on first load: read storage; if uninitialized or corrupt, seed a
// single scenario and persist it. If the key already exists (even as an empty
// array), respect it and DO NOT reseed — so "delete all" survives a refresh.
export function initScenarios(): Scenario[] {
  const stored = readStored();
  if (stored === null) {
    const seeded = [seedScenario()];
    writeStored(seeded);
    return seeded;
  }
  return stored;
}
