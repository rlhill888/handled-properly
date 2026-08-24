"use client";

import { useActionState, useMemo, useState } from "react";
import { sendMassEmail, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

type Category = { id: string; name: string };
type ContactPreview = { id: string; categoryIds: string[] };

export default function ComposeForm({
  categories,
  contacts,
}: {
  categories: Category[];
  contacts: ContactPreview[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(sendMassEmail, null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const recipientCount = useMemo(() => {
    if (selectedCategoryIds.length === 0) return contacts.length;
    return contacts.filter((c) => c.categoryIds.some((id) => selectedCategoryIds.includes(id)))
      .length;
  }, [contacts, selectedCategoryIds]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  };

  return (
    <form action={formAction} className={styles.form}>
      {state && "error" in state && <p className={styles.error}>{state.error}</p>}
      {state && "success" in state && (
        <p className={styles.description} style={{ color: "#0a7c2f" }}>
          {state.success}
        </p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="subject">
          Subject
        </label>
        <input id="subject" name="subject" required className={styles.input} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="body_html">
          Body (HTML)
        </label>
        <textarea
          id="body_html"
          name="body_html"
          required
          className={styles.textarea}
          style={{ minHeight: 200, fontFamily: "monospace" }}
          placeholder="<p>Hi there,</p>"
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Recipients{" "}
          <span className={styles.optional}>
            (no categories selected = everyone, {contacts.length} total)
          </span>
        </span>
        <div className={styles.metaRow}>
          {categories.length === 0 && (
            <span className={styles.emptyState}>No categories yet — all contacts will receive this.</span>
          )}
          {categories.map((category) => (
            <label key={category.id} className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="category_ids"
                value={category.id}
                checked={selectedCategoryIds.includes(category.id)}
                onChange={() => toggleCategory(category.id)}
              />
              {category.name}
            </label>
          ))}
        </div>
        <p className={styles.description}>
          This will send to <strong>{recipientCount}</strong> recipient
          {recipientCount === 1 ? "" : "s"}.
        </p>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
      </div>
    </form>
  );
}
