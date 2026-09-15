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
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Event date</th>
              <th>Featured</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.category ?? "—"}</td>
                <td>{post.eventDate ?? "—"}</td>
                <td>{post.isFeatured ? <span className={styles.badge}>Featured</span> : "—"}</td>
                <td>
                  <div className={styles.actions}>
                    <Link
                      href={`/portal/admin/website/blog/${post.id}/edit`}
                      className={styles.secondaryButton}
                    >
                      Edit
                    </Link>
                    <DeletePostButton postId={post.id} title={post.title} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
