"use client";

import { useActionState } from "react";
import { updateValue, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { AboutValue } from "@/lib/data/site-content";

export default function EditValueForm({ item }: { item: AboutValue }) {
  const boundUpdate = updateValue.bind(null, item.id);
  const [state, formAction] = useActionState<ActionState, FormData>(boundUpdate, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="value-title-edit">
          Title
        </label>
        <input
          id="value-title-edit"
          name="title"
          required
          defaultValue={item.title}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="value-description-edit">
          Description
        </label>
        <textarea
          id="value-description-edit"
          name="description"
          rows={3}
          defaultValue={item.description}
          className={styles.input}
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
