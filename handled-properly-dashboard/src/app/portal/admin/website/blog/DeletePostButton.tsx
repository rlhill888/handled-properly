"use client";

import { useTransition } from "react";
import { deleteBlogPost } from "./actions";
import styles from "@/styles/admin-shared.module.css";

export default function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const [isDeleting, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    startTransition(() => {
      deleteBlogPost(postId);
    });
  };

  return (
    <button
      type="button"
      className={styles.dangerButton}
      disabled={isDeleting}
      onClick={handleDelete}
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
