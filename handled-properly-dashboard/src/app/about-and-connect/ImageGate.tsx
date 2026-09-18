"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./about-and-connect.module.css";

// Holds the page's own entrance animation (see the ".ready ..." rules in
// about-and-connect.module.css) until every <img> rendered inside it has
// actually finished loading -- the profile photo, headshot, and social
// icons all arrive already fully downloaded and laid out, instead of the
// page animating in and then having images pop in / shift the layout as
// they trickle in over a slower connection. children is server-rendered
// content (the page's own data fetch stays in page.tsx); this component
// only needs to exist client-side to track the load events and flip a
// class once they're done.

export default function ImageGate({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) {
      setReady(true);
      return;
    }

    let cancelled = false;

    const waits = images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          const onDone = () => {
            img.removeEventListener("load", onDone);
            img.removeEventListener("error", onDone);
            resolve();
          };
          // Resolve on error too -- a single broken image (e.g. a since-
          // deleted upload) shouldn't hold the whole page hostage.
          img.addEventListener("load", onDone);
          img.addEventListener("error", onDone);
        })
    );

    // A slow/stuck image (offline, flaky connection) still can't block
    // the page forever.
    const timeout = new Promise<void>((resolve) => {
      setTimeout(resolve, 4000);
    });

    Promise.race([Promise.all(waits), timeout]).then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={containerRef} className={ready ? styles.ready : undefined}>
      {/* Without JS, ready never flips true and .blackout's opacity: 1 base
          state (along with .pageFade/.profileCard/.profileName/
          .socialButton/.kicker/.featuredCard's opacity: 0 ones) would
          stay stuck exactly as they start -- a permanently black screen
          with invisible content under it -- forever. This forces the
          real, fully-visible page instead. */}
      <noscript>
        <style>{`
          .${styles.blackout} { opacity: 0 !important; }
          .${styles.pageFade},
          .${styles.profileCard}, .${styles.profileName}, .${styles.socialButton},
          .${styles.kicker}, .${styles.featuredCard} {
            opacity: 1 !important;
            animation: none !important;
          }
        `}</style>
      </noscript>
      {/* Covers the whole screen solid black from first paint -- including
          AmbientBackground/AboutBackground, which render immediately as
          ImageGate's own siblings in page.tsx and aren't otherwise gated
          by it -- and fades away once .ready lands. See .blackout in the
          CSS module. Shows the site's own logo mark (same triangle as
          Navbar/Footer, just the mark on its own here) centered on it
          while it's up. */}
      <div className={styles.blackout} aria-hidden="true">
        <span className={styles.blackoutLogoMark} />
      </div>
      {/* Fades in as one quick beat right when .ready lands, before the
          individual elements inside start their own faster staggered
          entrances -- see .pageFade in the CSS module. */}
      <div className={styles.pageFade}>{children}</div>
    </div>
  );
}
