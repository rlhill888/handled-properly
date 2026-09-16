"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import styles from "./HowItWorks.module.css";

const PROCESS_STEPS = [
  {
    title: "Tell us about your event",
    description:
      "Send an inquiry through Start Planning Your Event and we'll follow up personally to talk through the details — no account or commitment required.",
    image: "/how-it-works-1.png",
  },
  {
    title: "We build your plan",
    description:
      "Vendors, timelines, and tasks all get organized in one place before anything is locked in, so you know exactly what's happening and when.",
    image: "/how-it-works-2.png",
  },
  {
    title: "Your team gets to work",
    description:
      "Staff are scheduled and roles are assigned ahead of time — everyone can see exactly what they're responsible for.",
    image: "/how-it-works-3.png",
  },
  {
    title: "We're there on the day",
    description:
      "From setup to breakdown, we're handling the moving pieces so you can actually be present for your own event.",
    image: "/how-it-works-4.png",
  },
];

export default function HowItWorks() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepperRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  // 1 = moving to a later step ("next"), -1 = moving to an earlier one
  // ("previous") -- drives which side the incoming image/text slides in
  // from (see --dir in HowItWorks.module.css). Read by CSS as a custom
  // property rather than two separate class pairs, so one set of rules
  // handles both directions.
  const [direction, setDirection] = useState<1 | -1>(1);

  // Scroll-linked, not scroll-triggered: every frame, measure how far this
  // section has scrolled past the top of the viewport and turn that into a
  // 0-1 progress value, then pick the current step from it. This renders
  // ONE pinned panel (position: sticky) whose content crossfades as the
  // active step changes -- there's no separate section per step and no
  // hard CSS scroll-snap stop; scrolling into a full-height sticky panel
  // is what gives the "locks to fill the screen" feel on its own.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let rafId: number;

    const update = () => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const total = rect.height - window.innerHeight;
        const progress = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
        const next = Math.min(
          PROCESS_STEPS.length - 1,
          Math.floor(progress * PROCESS_STEPS.length)
        );
        if (next !== activeRef.current) {
          setDirection(next > activeRef.current ? 1 : -1);
          activeRef.current = next;
          setActive(next);
        }

        // A slow, continuous grow tied directly to overall scroll position
        // -- set via a ref rather than React state since it changes every
        // frame while scrolling and doesn't need to trigger a re-render.
        // Monotonic across the *whole* section (not reset per step): it
        // only ever grows scrolling down and only ever shrinks scrolling
        // up, so there's no up-then-down pulse within a single step.
        if (stepperRef.current && !prefersReducedMotion) {
          const scale = 0.96 + progress * 0.07;
          stepperRef.current.style.transform = `scale(${scale.toFixed(3)})`;
        }
      }
      rafId = requestAnimationFrame(update);
    };

    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  function scrollToStep(i: number) {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    // Land a little past the step's boundary (not exactly on it) so the
    // computed progress unambiguously lands in that step's range.
    const targetProgress = i / PROCESS_STEPS.length + 0.02;
    window.scrollTo({ top: window.scrollY + rect.top + targetProgress * total, behavior: "smooth" });
  }

  return (
    <section
      ref={containerRef}
      className={styles.section}
      style={{ height: `${PROCESS_STEPS.length * 100}vh` }}
    >
      <div className={styles.sticky}>
        <span aria-hidden="true" className={styles.bigNumber}>
          {String(active + 1).padStart(2, "0")}
        </span>

        <div className={styles.layout} style={{ "--dir": direction } as CSSProperties}>
          {/* A direct sibling of imageStack/stepper (not nested inside
              stepper) so it can sit above the image on mobile while still
              grouping visually with the step text on desktop -- see the
              grid layout in HowItWorks.module.css. */}
          <p className={styles.kicker}>HOW IT WORKS</p>

          <div className={styles.imageStack}>
            {PROCESS_STEPS.map((step, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={step.image}
                src={step.image}
                alt=""
                className={i === active ? `${styles.image} ${styles.imageActive}` : styles.image}
              />
            ))}
          </div>

          <div className={styles.stepper} ref={stepperRef}>
            <div className={styles.stepStack}>
              {PROCESS_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className={i === active ? `${styles.stepPanel} ${styles.stepPanelActive}` : styles.stepPanel}
                >
                  <p className={styles.stepLabel}>
                    <span className={styles.stepLabelLine} />
                    STEP {String(i + 1).padStart(2, "0")} OF{" "}
                    {String(PROCESS_STEPS.length).padStart(2, "0")}
                  </p>
                  <p className={styles.stepTitle}>{step.title}</p>
                  <p className={styles.stepDescription}>{step.description}</p>
                </div>
              ))}
            </div>

            <div className={styles.progress}>
              {PROCESS_STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => scrollToStep(i)}
                  className={i === active ? `${styles.segment} ${styles.segmentActive}` : styles.segment}
                  aria-label={`Go to step ${i + 1}`}
                  aria-current={i === active}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
