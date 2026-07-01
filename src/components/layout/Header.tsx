// Header — GAP logo, program title, and the signature tricolor rule. The logo is
// a transparent PNG so the black header shows through behind it.

import { Tricolor } from "../shared/Tricolor";
import gapLogo from "../../assets/gap-logo-header.png";

export function Header() {
  return (
    <header className="bg-chrome">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-6 py-5">
        <img
          src={gapLogo}
          alt="GAP Partners"
          className="h-10 w-auto shrink-0"
        />
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-light tracking-tight text-white sm:text-3xl">
            SPURS ARENA
            <span className="mx-2 text-chrome-muted">—</span>
            <span className="text-chrome-muted">PROGRAM &amp; COST MODEL</span>
          </h1>
          <p className="mt-0.5 text-sm text-chrome-muted">
            GAP Partners · Guido · Austin · PCL joint venture
          </p>
        </div>
      </div>
      <Tricolor />
    </header>
  );
}
