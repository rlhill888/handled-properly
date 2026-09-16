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
        {/* Video zone is just the headline + first paragraph -- it ends
            here, before .actions, not behind the whole hero. Mobile only
            (see .bgVideo's media query); on desktop this is a plain,
            unstyled wrapper. */}
        <div className={styles.videoZone}>
          {/* Placeholder footage -- real background video for the header
              once one exists. Muted + playsInline + loop are all required
              for autoplay to actually start on mobile Safari/Chrome. */}
          <video
            className={styles.bgVideo}
            src="/hero-mobile-placeholder.mov"
            poster="/hero-mobile-poster.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
          />
          <div className={styles.bgOverlay} aria-hidden="true" />

          <div className={styles.videoZoneText}>
            <p className={`${styles.eyebrow} ${styles.reveal}`} style={{ animationDelay: "0.02s" }}>
              <span className={styles.eyebrowLine} />
              EVENT PLANNING, HANDLED
            </p>
            <h1 className={styles.headline}>
              <span className={`${styles.headlineLine} ${styles.reveal}`} style={{ animationDelay: "0.15s" }}>
                WE PLAN.
              </span>
              <span className={`${styles.headlineLine} ${styles.reveal}`} style={{ animationDelay: "0.28s" }}>
                WE COORDINATE.
              </span>
              <span
                className={`${styles.headlineLine} ${styles.headlineMuted} ${styles.reveal}`}
                style={{ animationDelay: "0.4s" }}
              >
                WE DELIVER.
              </span>
            </h1>
            <p className={`${styles.subtext} ${styles.reveal}`} style={{ animationDelay: "0.52s" }}>
              Handled Properly is the all-in-one portal for planning unforgettable
              events — from vendors and budgets to timelines and the big day
              itself.
            </p>
          </div>
        </div>

        <div className={`${styles.actions} ${styles.reveal}`} style={{ animationDelay: "0.64s" }}>
          <a href="/get-started" className={styles.primaryAction}>
            Start Planning
            <span aria-hidden="true">↗</span>
          </a>
          <a href="/events" className={styles.secondaryAction}>
            <span className={styles.playDot} aria-hidden="true">
              ▶
            </span>
            <span>View Our Events</span>
            <span className={styles.secondaryArrow} aria-hidden="true">
              ↗
            </span>
          </a>
        </div>
      </div>

      <div className={`${styles.visual} ${styles.reveal}`} style={{ animationDelay: "0.3s" }}>
        <svg
          className={styles.visualArt}
          viewBox="0 0 800 600"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="800" height="600" fill="#0a0a0a" />
          <path
            className={`${styles.wave} ${styles.wave1}`}
            d="M -50 420 C 150 320, 300 520, 500 380 C 650 280, 750 360, 850 300"
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="2"
            fill="none"
          />
          <path
            className={`${styles.wave} ${styles.wave2}`}
            d="M -50 470 C 150 380, 300 560, 500 430 C 650 340, 750 410, 850 350"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="2"
            fill="none"
          />
          <path
            className={`${styles.wave} ${styles.wave3}`}
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
