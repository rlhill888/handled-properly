import { notFound } from "next/navigation";
import { getBlogPostById } from "@/lib/data/site-content";
import BlogPostForm from "../../BlogPostForm";
import styles from "@/styles/admin-shared.module.css";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Website / Events Blog</span>
          <h1 className={styles.title}>Edit Post</h1>
        </div>
      </div>

      <div className={styles.card}>
        <BlogPostForm post={post} />
      </div>
    </div>
  );
}
