import Link from "next/link";
import { getAllBlogPosts } from "@/lib/data/site-content";
import DeletePostButton from "./DeletePostButton";
import styles from "@/styles/admin-shared.module.css";

export default async function BlogPage() {
  const posts = await getAllBlogPosts();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>Events Blog</h1>
          </div>
          <p className={styles.description}>
            Past-event write-ups shown on the public Events page. Featured posts also appear on
            the homepage.
          </p>
        </div>
        <Link href="/portal/admin/website/blog/new" className={styles.primaryButton}>
          New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <p className={styles.emptyState}>No posts yet.</p>
      ) : (
        <div className={styles.postCardGrid}>
          {posts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              {post.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={post.coverImageUrl} alt="" className={styles.eventCardImage} />
              ) : (
                <div className={styles.eventCardImagePlaceholder}>No cover image</div>
              )}
              <div className={styles.postCardBody}>
                <div className={styles.postCardTitleRow}>
                  <span className={styles.postCardTitle}>{post.title}</span>
                  {post.isFeatured && <span className={styles.badge}>Featured</span>}
                </div>
                <span className={styles.postCardMeta}>
                  {post.category ?? "No category"} · {post.eventDate ?? "No event date"}
                </span>
              </div>
              <div className={styles.postCardActions}>
                <Link
                  href={`/portal/admin/website/blog/${post.id}/edit`}
                  className={styles.secondaryButton}
                >
                  Edit
                </Link>
                <DeletePostButton postId={post.id} title={post.title} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
