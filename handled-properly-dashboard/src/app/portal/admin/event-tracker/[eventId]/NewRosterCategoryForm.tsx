"use client";

import { useActionState, useRef, useEffect } from "react";
import { createRosterCategory, type ActionState } from "../actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewRosterCategoryForm({ eventId }: { eventId: string }) {
  const boundAction = createRosterCategory.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
    }
    previousState.current = state;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="roster-category-name">
          Name
        </label>
        <input
          id="roster-category-name"
          name="name"
          required
          className={styles.input}
          placeholder="e.g. Security"
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Category</SubmitButton>
      </div>
    </form>
  );
}
