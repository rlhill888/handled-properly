import ScrollReveal from "@/components/ScrollReveal";
import ArrowIcon from "@/components/icons/ArrowIcon";
import styles from "./ClosingCta.module.css";

// The site's final call-to-action, on every breakpoint -- previously this
// was a mobile-only button tucked inside Footer (desktop relied on the
// Navbar/Hero actions above the fold instead), but that left the page
// without a closing CTA of its own. This is its own section now, sitting
// right above the footer.
//
// The background reuses this site's own line-art motif (see Hero's and
// BuiltForMoments' drifting wave/grid SVGs) rather than a generic
// gradient, plus a slow-moving radial glow for a bit of a "spotlight"
// moment on the page's final ask -- both gated behind
// prefers-reduced-motion like every other animation on this site.
export default function ClosingCta() {
  return (
    <section className={styles.section}>
      <div className={styles.glow} aria-hidden="true" />
      <svg
        className={styles.art}
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className={`${styles.wave} ${styles.wave1}`}
          d="M -50 340 C 150 260, 300 420, 500 300 C 650 220, 750 280, 850 240"
          stroke="rgba(255,255,255,0.16)"
          strokeWidth="2"
          fill="none"
        />
        <path
          className={`${styles.wave} ${styles.wave2}`}
          d="M -50 380 C 150 300, 300 460, 500 340 C 650 260, 750 320, 850 280"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth="2"
          fill="none"
        />
        <g stroke="rgba(255,255,255,0.07)" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
          ))}
        </g>
      </svg>

      {/* The site's only major content section that didn't fade in on
          scroll (the wave/glow background is ambient and stays as-is --
          only the real text/CTA content gets the reveal, same split as
          BuiltForMoments' .introGroup) -- it used to just pop in fully
          visible the instant it entered the viewport, out of step with
          every section above it. */}
      <ScrollReveal className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          READY WHEN YOU ARE
        </p>
        <h2 className={styles.heading}>
          Let&apos;s start planning
          <br />
          your next event.
        </h2>
        <a href="/get-started" className={styles.cta}>
          <span className={styles.ctaSheen} aria-hidden="true" />
          <span>Start Planning Today</span>
          <ArrowIcon direction="up-right" />
        </a>
      </ScrollReveal>
    </section>
  );
}
