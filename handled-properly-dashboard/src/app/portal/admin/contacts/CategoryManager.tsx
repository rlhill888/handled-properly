"use client";

import { useActionState, useRef, useEffect, useTransition } from "react";
import { createCategory, deleteCategory, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function CategoryManager({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(createCategory, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
    }
    previousState.current = state;
  }, [state]);

  const handleDelete = (categoryId: string) => {
    if (!confirm("Delete this category? It will be removed from any contacts tagged with it."))
      return;
    startTransition(() => {
      deleteCategory(categoryId);
    });
  };

  return (
    <div className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <form ref={formRef} action={formAction} className={styles.formRow}>
        <input
          name="name"
          required
          className={styles.input}
          placeholder="New category, e.g. VIP"
        />
        <SubmitButton pendingLabel="Adding…" variant="secondary">
          Add Category
        </SubmitButton>
      </form>

      <div className={styles.metaRow}>
        {categories.length === 0 && <span className={styles.emptyState}>No categories yet.</span>}
        {categories.map((category) => (
          <span key={category.id} className={styles.pill}>
            {category.name}{" "}
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              aria-label={`Delete ${category.name}`}
              style={{ marginLeft: 4, cursor: "pointer", border: "none", background: "none" }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
