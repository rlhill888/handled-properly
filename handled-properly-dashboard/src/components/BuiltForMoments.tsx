import ScrollReveal from "@/components/ScrollReveal";
import styles from "./BuiltForMoments.module.css";

const PILLS = ["Vendors", "Budgets", "Timelines"];

// Mobile-only card echoing Hero's dark wave-art treatment (see
// Hero.tsx's .visualArt) with its own headline and a row of feature
// pills -- hidden at desktop widths via .section's media query, where
// this content isn't shown.
export default function BuiltForMoments() {
  return (
    <section className={styles.section}>
      <svg
        className={styles.art}
        viewBox="0 0 800 500"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <path
          className={styles.wave}
          d="M -50 340 C 150 260, 300 420, 500 300 C 650 220, 750 280, 850 240"
          stroke="rgba(10,10,10,0.18)"
          strokeWidth="2"
          fill="none"
        />
        <path
          className={styles.wave}
          d="M -50 380 C 150 300, 300 460, 500 340 C 650 260, 750 320, 850 280"
          stroke="rgba(10,10,10,0.1)"
          strokeWidth="2"
          fill="none"
        />
        <g stroke="rgba(10,10,10,0.07)" strokeWidth="1">
          {Array.from({ length: 9 }).map((_, i) => (
            <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="500" />
          ))}
          {Array.from({ length: 6 }).map((_, i) => (
            <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
          ))}
        </g>
      </svg>

      <div className={styles.content}>
        <ScrollReveal className={styles.introGroup}>
          <p className={styles.eyebrow}>
            <span className={styles.sunburst} aria-hidden="true" />
            BUILT FOR YOUR BIG MOMENTS
          </p>
          <h2 className={styles.headline}>
            Every detail.
            <br />
            One clear plan.
          </h2>
          <p className={styles.subtext}>
            Vendors, budgets, and timelines — everything organized in one
            place, so nothing gets missed.
          </p>
        </ScrollReveal>
        <div className={styles.pills}>
          {PILLS.map((pill, i) => (
            <ScrollReveal
              key={pill}
              delay={Math.min(i + 1, 4) as 0 | 1 | 2 | 3 | 4}
              className={styles.pill}
            >
              {pill.toUpperCase()}
            </ScrollReveal>
          ))}
        </div>
        {/* Moved in from a separate section below this card -- the only
            action offered here now, so there's no need for the two-button
            row that used to live elsewhere on mobile. */}
        <a href="/get-started" className={styles.cta}>
          <span>Start Planning</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </section>
  );
}
