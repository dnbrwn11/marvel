// Context wrapper around useArenaModel so data-driven tab components can pull the
// single source of truth without threading props through Tabs. The provider owns
// exactly one useArenaModel instance; useArena() reads it.

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useArenaModel } from "./useArenaModel";
import type { ArenaModel } from "./useArenaModel";

const ArenaModelContext = createContext<ArenaModel | null>(null);

export function ArenaModelProvider({ children }: { children: ReactNode }) {
  const arena = useArenaModel();
  return (
    <ArenaModelContext.Provider value={arena}>
      {children}
    </ArenaModelContext.Provider>
  );
}

export function useArena(): ArenaModel {
  const ctx = useContext(ArenaModelContext);
  if (!ctx) {
    throw new Error("useArena must be used within an <ArenaModelProvider>");
  }
  return ctx;
}
