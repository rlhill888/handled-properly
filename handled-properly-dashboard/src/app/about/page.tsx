import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlockRenderer from "@/components/BlockRenderer";
import { getAboutContent } from "@/lib/data/site-content";
import styles from "./about.module.css";

export const metadata: Metadata = {
  title: "About — Handled Properly",
  description: "Learn about Handled Properly, the all-in-one portal for planning unforgettable events.",
};

// Admin-edited About content must show up on the next page load, not just
// the next deploy -- see the matching note in src/app/page.tsx.
export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const about = await getAboutContent();

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            ABOUT US
          </p>
        </div>

        <div className={styles.content}>
          <BlockRenderer blocks={about.blocks} imageUrls={about.imageUrls} />
        </div>
      </main>
      <Footer />
    </>
  );
}
