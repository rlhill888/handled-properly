import BlogPostForm from "../BlogPostForm";
import styles from "@/styles/admin-shared.module.css";

export default function NewBlogPostPage() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website / Events Blog</span>
          <h1 className={styles.title}>New Post</h1>
        </div>
      </div>

      <div className={styles.card}>
        <BlogPostForm />
      </div>
    </div>
  );
}
