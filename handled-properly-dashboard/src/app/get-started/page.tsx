import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GetStartedForm from "./GetStartedForm";
import styles from "./get-started.module.css";

export const metadata: Metadata = {
  title: "Get Started — Handled Properly",
  description: "Tell us about your event and we'll follow up to talk through the details.",
};

export default function GetStartedPage() {
  return (
    <main className={styles.page}>
      <Navbar />

      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          EVENT PLANNING, HANDLED
        </p>
        <h1 className={styles.headline}>Tell us about your event.</h1>
        <p className={styles.subtext}>
          Send us an inquiry and we&apos;ll follow up to talk through the details — no account or
          commitment required.
        </p>
      </div>

      <div className={styles.formSection}>
        <GetStartedForm />
      </div>

      <Footer />
    </main>
  );
}
