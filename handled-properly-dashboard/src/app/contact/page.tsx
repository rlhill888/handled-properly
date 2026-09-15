import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import styles from "./contact.module.css";

export const metadata: Metadata = {
  title: "Contact — Handled Properly",
  description: "Get in touch with Handled Properly to start planning your event.",
};

// Server-rendered per request, consistent with the other nav pages -- see
// the matching note in src/app/page.tsx (this one has no DB content yet,
// but keeping it dynamic avoids a static/dynamic split across the nav).
export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            GET IN TOUCH
          </p>
          <h1 className={styles.headline}>Let&apos;s talk about your event.</h1>
          <p className={styles.subtext}>
            The fastest way to reach us is to tell us about your event — we&apos;ll follow up
            personally to talk through the details.
          </p>
        </div>

        <div className={styles.actions}>
          <a href="/get-started" className={styles.cta}>
            <span>Start Planning Your Event</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
