// Tabs — data-driven. Renders the tab strip and active panel from a plain array
// of { id, label, component }. Adding a tab later is a single array entry (see
// App.tsx). Tab bodies read the model from ArenaModelContext, so no props flow
// through here. Active tab is tracked by id.

import { useState } from "react";
import type { ComponentType } from "react";

export interface TabDef {
  id: string;
  label: string;
  component: ComponentType;
}

export function Tabs({ tabs }: { tabs: TabDef[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const ActivePanel = active?.component;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-card bg-surface">
        <div
          role="tablist"
          aria-label="Views"
          className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4"
        >
          {tabs.map((tab) => {
            const selected = tab.id === active?.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveId(tab.id)}
                className={[
                  "relative -mb-px shrink-0 whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors duration-150 focus:outline-none",
                  selected
                    ? "text-teal"
                    : "text-muted hover:text-ink",
                ].join(" ")}
              >
                {tab.label}
                <span
                  className={[
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-all duration-200",
                    selected ? "bg-teal opacity-100" : "opacity-0",
                  ].join(" ")}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div role="tabpanel" className="flex-1 overflow-auto">
        {ActivePanel && <ActivePanel />}
      </div>
    </div>
  );
}
