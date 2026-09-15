"use client";

import { useActionState } from "react";
import { createBlogPost, updateBlogPost, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import BlockEditor from "../BlockEditor";
import styles from "@/styles/admin-shared.module.css";
import type { BlogPost } from "@/lib/data/site-content";

export default function BlogPostForm({ post }: { post?: BlogPost }) {
  const action = post ? updateBlogPost.bind(null, post.id) : createBlogPost;
  const [state, formAction] = useActionState<ActionState, FormData>(action, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="post-title">
          Title
        </label>
        <input
          id="post-title"
          name="title"
          required
          defaultValue={post?.title}
          className={styles.input}
          placeholder="Bloom & Co. Wedding"
        />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="post-category">
            Category <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="post-category"
            name="category"
            defaultValue={post?.category ?? ""}
            className={styles.input}
            placeholder="Full Planning / Design"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="post-event-date">
            Event date <span className={styles.optional}>(optional)</span>
          </label>
          <input
            id="post-event-date"
            name="event_date"
            type="date"
            defaultValue={post?.eventDate ?? ""}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="post-excerpt">
          Excerpt <span className={styles.optional}>(optional, shown on cards)</span>
        </label>
        <input
          id="post-excerpt"
          name="excerpt"
          defaultValue={post?.excerpt ?? ""}
          className={styles.input}
        />
      </div>

      <BlockEditor initialBlocks={post?.blocks ?? []} />

      {post?.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.coverImageUrl} alt="" className={styles.eventHeaderImage} />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="post-cover-image">
          {post?.coverImageUrl ? "Replace cover image" : "Cover image"}{" "}
          <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="post-cover-image"
          name="cover_image"
          type="file"
          accept="image/*"
          className={styles.input}
        />
      </div>

      {post?.coverImageUrl && (
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="remove_cover_image" />
          Remove current cover image
        </label>
      )}

      <label className={styles.checkboxRow}>
        <input type="checkbox" name="is_featured" defaultChecked={post?.isFeatured} />
        Feature on the homepage
      </label>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">{post ? "Save Changes" : "Create Post"}</SubmitButton>
      </div>
    </form>
  );
}
