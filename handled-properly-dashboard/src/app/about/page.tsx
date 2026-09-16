import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import styles from "./about.module.css";

// Hand-coded, not Content-Block-driven -- see
// docs/adr/0031-about-page-hand-coded-not-block-driven.md for why. Purely
// static content, so no admin data fetch and nothing to revalidate --
// this can (and should) statically prerender at build time.
export const metadata: Metadata = {
  title: "About — Handled Properly",
  description: "Learn about Handled Properly, the all-in-one portal for planning unforgettable events.",
};

const DIFFERENTIATORS = [
  {
    title: "One shared source of truth",
    description:
      "Staff, clients, and vendors all see the same schedule and the same updates — not their own separate copy that drifts out of date.",
  },
  {
    title: "Built for the day of, not just the planning",
    description:
      "Most tools stop at the spreadsheet. We stay with you through setup, service, and breakdown, not just the weeks before.",
  },
  {
    title: "Clear roles, no guessing",
    description:
      "Every staff member knows exactly what they're responsible for and when — not a group chat someone has to keep re-explaining.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowLine} />
              ABOUT US
            </p>
            <h1 className={styles.headline}>
              Big moments.
              <br />
              Small details.
              <br />
              <span className={styles.headlineMuted}>Handled properly.</span>
            </h1>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/about/hero.png" alt="" className={styles.heroImage} />
        </section>

        <Reveal>
          <section className={styles.story}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/about/story.png" alt="" className={styles.storyImage} />
            <div className={styles.storyText}>
              <p className={styles.kicker}>WHO WE ARE</p>
              <p className={styles.storyParagraph}>
                Handled Properly is an event-staffing and coordination platform for people planning
                events who don&apos;t want to run the day off a group chat, a spreadsheet, and a
                stack of sticky notes. We work with clients and event staff wherever the event is
                happening — weddings, corporate events, galas, and everything in between.
              </p>
              <p className={styles.storyParagraph}>
                We built it after watching the same thing happen event after event: the plan was
                solid, the vendors were booked, and things still nearly fell apart because nobody
                had one shared place to see the roster, the timeline, and who was responsible for
                what. So we built one — a single portal where staff schedules, client updates, and
                task assignments live together, instead of scattered across texts and inboxes.
              </p>
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.different}>
            <p className={styles.kicker}>WHAT MAKES US DIFFERENT</p>
            <div className={styles.differentGrid}>
              {DIFFERENTIATORS.map((item, index) => (
                <div key={item.title} className={styles.differentItem}>
                  <span className={styles.differentNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <p className={styles.differentTitle}>{item.title}</p>
                  <p className={styles.differentDescription}>{item.description}</p>
                </div>
              ))}
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.testimonial}>
            <span className={styles.testimonialTag}>Placeholder — add a real client quote here</span>
            <p className={styles.testimonialQuote}>
              &ldquo;This is where a real client testimonial will go.&rdquo;
            </p>
            <p className={styles.testimonialAttribution}>— Client name, event type</p>
          </section>
        </Reveal>

        <Reveal>
          <section className={styles.cta}>
            <h2 className={styles.ctaHeading}>Ready to plan your event?</h2>
            <a href="/get-started" className={styles.ctaButton}>
              <span>Plan Your Event</span>
              <span aria-hidden="true">↗</span>
            </a>
          </section>
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
