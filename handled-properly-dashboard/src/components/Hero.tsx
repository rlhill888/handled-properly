import styles from "./Hero.module.css";

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.rail}>
        <span className={styles.railIndex}>
          01<span className={styles.railTotal}>/03</span>
        </span>
        <span className={styles.railLine} />
        <span className={styles.railDots}>
          <span className={styles.railDotActive} />
          <span className={styles.railDot} />
          <span className={styles.railDot} />
        </span>
      </div>

      <div className={styles.content}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          EVENT PLANNING, HANDLED
        </p>
        <h1 className={styles.headline}>
          WE PLAN.
          <br />
          WE COORDINATE.
          <br />
          <span className={styles.headlineMuted}>WE DELIVER.</span>
        </h1>
        <p className={styles.subtext}>
          Handled Properly is the all-in-one portal for planning unforgettable
          events — from vendors and budgets to timelines and the big day
          itself.
        </p>
        <div className={styles.actions}>
          <a href="/get-started" className={styles.primaryAction}>
            Start Planning
            <span aria-hidden="true">↗</span>
          </a>
          <a href="/events" className={styles.secondaryAction}>
            <span className={styles.playDot} aria-hidden="true">
              ▶
            </span>
            View Our Events
          </a>
        </div>
      </div>

      <div className={styles.visual}>
        <svg
          className={styles.visualArt}
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="800" height="600" fill="#0a0a0a" />
          <path
            d="M -50 420 C 150 320, 300 520, 500 380 C 650 280, 750 360, 850 300"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M -50 470 C 150 380, 300 560, 500 430 C 650 340, 750 410, 850 350"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M -50 380 C 150 270, 300 470, 500 330 C 650 230, 750 310, 850 250"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="2"
            fill="none"
          />
          <g stroke="rgba(255,255,255,0.08)" strokeWidth="1">
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v-${i}`} x1={i * 100} y1="0" x2={i * 100} y2="600" />
            ))}
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 100} x2="800" y2={i * 100} />
            ))}
          </g>
        </svg>

        <div className={styles.callout}>
          <span className={styles.calloutMark} aria-hidden="true" />
          <p>
            WE TURN VISION
            <br />
            INTO UNFORGETTABLE
            <br />
            EVENTS.
          </p>
        </div>
      </div>
    </section>
  );
}
