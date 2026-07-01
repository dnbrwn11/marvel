// Banner — the non-negotiable framing disclaimer. Rendered persistently on every
// tab as a black footer bar (matching the GAP cover chrome) so no view can be
// mistaken for a priced estimate. The tricolor rule tops the footer as a divider.

import { Tricolor } from "../shared/Tricolor";

export function Banner() {
  return (
    <footer>
      <Tricolor />
      <div className="bg-chrome px-6 py-4">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-xs leading-relaxed text-chrome-muted">
            Concept-level parametric program model — planning assumptions, not a
            cost estimate. Unit rates are placeholders pending validation.
          </p>
          <p className="mt-2 text-xs font-medium tracking-wide text-white/70">
            Local Roots · Texas Strength · Spurs-Level Excellence
          </p>
        </div>
      </div>
    </footer>
  );
}
