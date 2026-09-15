import styles from "./FeaturedEvents.module.css";
import type { BlogPostSummary } from "@/lib/data/site-content";

export default function FeaturedEvents({ posts }: { posts: BlogPostSummary[] }) {
  if (posts.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          <span className={styles.eyebrowLine} />
          FEATURED EVENTS
        </p>
        <h2 className={styles.heading}>
          Events that
          <br />
          leave a mark.
        </h2>
        <a href="/events" className={styles.exploreLink}>
          Explore All Events
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className={styles.grid}>
        {posts.map((post, index) => (
          <a key={post.id} href={`/events/${post.slug}`} className={styles.card}>
            <div className={styles.thumb}>
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImageUrl} alt="" className={styles.thumbImage} />
              ) : (
                <span className={styles.thumbIndex}>{String(index + 1).padStart(2, "0")}</span>
              )}
            </div>
            <div className={styles.cardFooter}>
              <div>
                <p className={styles.cardTitle}>{post.title}</p>
                {post.category && <p className={styles.cardCategory}>{post.category}</p>}
              </div>
              <span aria-hidden="true">→</span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
