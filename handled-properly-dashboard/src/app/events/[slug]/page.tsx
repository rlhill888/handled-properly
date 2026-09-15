import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BlockRenderer from "@/components/BlockRenderer";
import { getBlogPostBySlug } from "@/lib/data/site-content";
import styles from "./event-detail.module.css";

// Admin edits/deletes to a Blog Post must show up on the next page load,
// not just the next deploy -- see the matching note in src/app/page.tsx.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Event — Handled Properly" };

  return {
    title: `${post.title} — Handled Properly`,
    description: post.excerpt ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.intro}>
          <a href="/events" className={styles.backLink}>
            ← All Events
          </a>
          <p className={styles.eyebrow} style={{ marginTop: 24 }}>
            <span className={styles.eyebrowLine} />
            {post.category ?? "EVENT"}
          </p>
          <h1 className={styles.headline}>{post.title}</h1>
          {post.eventDate && (
            <div className={styles.meta}>
              <span>
                {new Date(post.eventDate + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        <div className={styles.content}>
          {post.coverImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.coverImageUrl} alt="" className={styles.cover} />
          )}
          <BlockRenderer blocks={post.blocks} imageUrls={post.imageUrls} />
        </div>
      </main>
      <Footer />
    </>
  );
}
