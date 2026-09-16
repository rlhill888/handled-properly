"use client";

import { useEffect } from "react";

// The real, intended gap to Featured Events is just the card's own CSS
// margin-bottom (see .builtForMoments in page.module.css) -- small and
// fixed, not engineered here to hit some target "peek" size (an earlier
// version of this did that and produced a much bigger gap than intended,
// since inflating the margin to keep the pre-scroll peek small also
// inflates the permanent gap between the sections). All this component
// does now is cap that margin so it never adds MORE gap than fits above
// the fold -- on a phone short enough that Hero + the card already reach
// the bottom of the screen on their own, the full 20px would otherwise
// tack on beyond that. On any normal phone there's room to spare and this
// is a no-op; the CSS default is what actually applies.
const DEFAULT_MARGIN_PX = 20;
const MOBILE_BREAKPOINT = 900;

export default function HeroPeekAdjuster() {
  useEffect(() => {
    const card = document.querySelector<HTMLElement>("[data-peek-card]");
    if (!card) return;

    function adjust() {
      if (!card) return;
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        // Desktop: BuiltForMoments renders nothing here -- leave the CSS
        // default alone.
        card.style.marginBottom = "";
        return;
      }

      // Reset first so this measurement reflects the card's natural
      // position, not a stale adjustment from the last run.
      card.style.marginBottom = "";
      const rect = card.getBoundingClientRect();
      // Keep the small default gap, but never let it be large enough to
      // push Featured Events' start past the bottom of the viewport by
      // more than the gap itself would already do naturally -- i.e. cap
      // it so the two sections never end up further apart than intended
      // just because a particular phone is unusually short.
      const maxSafeMargin = Math.max(window.innerHeight - rect.bottom, 0);
      const margin = Math.min(DEFAULT_MARGIN_PX, maxSafeMargin);
      card.style.marginBottom = `${margin}px`;
    }

    adjust();
    window.addEventListener("resize", adjust);
    return () => window.removeEventListener("resize", adjust);
  }, []);

  return null;
}
