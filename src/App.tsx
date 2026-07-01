// App — composition root. Owns the single ArenaModelProvider (one source of
// truth), renders the header + tricolor, the data-driven tabs, and the persistent
// framing banner as a footer on every tab.
//
// Adding a tab later = one entry in TABS below (data-driven Tabs).

import { ArenaModelProvider } from "./state/ArenaModelContext";
import { Header } from "./components/layout/Header";
import { Tabs } from "./components/layout/Tabs";
import type { TabDef } from "./components/layout/Tabs";
import { Banner } from "./components/layout/Banner";
import { ProgramAndCost } from "./components/program/ProgramAndCost";
import { AnalyticsPanel } from "./components/analytics/AnalyticsPanel";
import { ManpowerPanel } from "./components/manpower/ManpowerPanel";
import SiteTimeline from "./components/SiteTimeline";

// Page-container wrapper so the timeline showpiece gets the same max-width and
// padding as the other tabs (the component itself is unchanged).
function SiteTimelineTab() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <SiteTimeline />
    </div>
  );
}

const TABS: TabDef[] = [
  { id: "program", label: "Program & Cost", component: ProgramAndCost },
  { id: "analytics", label: "Analytics", component: AnalyticsPanel },
  { id: "manpower", label: "Manpower & Resourcing", component: ManpowerPanel },
  { id: "timeline", label: "Site Timeline", component: SiteTimelineTab },
];

function App() {
  return (
    <ArenaModelProvider>
      <div className="flex min-h-screen flex-col bg-panel">
        <Header />
        <Tabs tabs={TABS} />
        <Banner />
      </div>
    </ArenaModelProvider>
  );
}

export default App;
