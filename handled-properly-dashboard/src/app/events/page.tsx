import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import AmbientBackground from "@/components/AmbientBackground";
import { getAllBlogPosts } from "@/lib/data/site-content";
import styles from "./events.module.css";

export const metadata: Metadata = {
  title: "Events — Handled Properly",
  description: "A look back at events Handled Properly has planned and coordinated.",
};

// Admin-edited Blog Posts must show up on the next page load, not just the
// next deploy -- see the matching note in src/app/page.tsx.
export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const posts = await getAllBlogPosts();

  return (
    <>
      <AmbientBackground />
      <Navbar />
      <main className={styles.page}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span className={styles.eyebrowLine} />
            OUR WORK
          </p>
          <h1 className={styles.headline}>Events we&apos;ve handled.</h1>
          <p className={styles.subtext}>
            A look back at events we&apos;ve planned, coordinated, and delivered.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className={styles.empty}>No events posted yet — check back soon.</p>
        ) : (
          <div className={styles.grid}>
            {posts.map((post) => (
              <Reveal key={post.id}>
                <a href={`/events/${post.slug}`} className={styles.card}>
                  <div className={styles.thumb}>
                    {post.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImageUrl} alt="" className={styles.thumbImage} />
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    {post.category && <p className={styles.cardCategory}>{post.category}</p>}
                    <p className={styles.cardTitle}>{post.title}</p>
                    {post.excerpt && <p className={styles.cardExcerpt}>{post.excerpt}</p>}
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
