"use client";

import { useTransition } from "react";
import { deleteCategory } from "./actions";
import styles from "@/styles/admin-shared.module.css";

export default function CategoryManager({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [, startTransition] = useTransition();

  const handleDelete = (categoryId: string, name: string) => {
    if (!confirm(`Delete "${name}"? It will be removed from any contacts tagged with it.`))
      return;
    startTransition(() => {
      deleteCategory(categoryId);
    });
  };

  if (categories.length === 0) {
    return <p className={styles.emptyState}>No categories yet.</p>;
  }

  return (
    <div className={styles.metaRow}>
      {categories.map((category) => (
        <span key={category.id} className={styles.pill}>
          {category.name}
          <button
            type="button"
            className={styles.pillDelete}
            onClick={() => handleDelete(category.id, category.name)}
            aria-label={`Delete ${category.name}`}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
