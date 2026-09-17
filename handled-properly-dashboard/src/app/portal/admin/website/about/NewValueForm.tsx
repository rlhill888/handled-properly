"use client";

import { useActionState, useRef, useEffect } from "react";
import { createValue, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewValueForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createValue, null);
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
        <label className={styles.label} htmlFor="value-title">
          Title
        </label>
        <input
          id="value-title"
          name="title"
          required
          className={styles.input}
          placeholder="e.g. One shared source of truth"
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="value-description">
          Description
        </label>
        <textarea id="value-description" name="description" rows={3} className={styles.input} />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Value</SubmitButton>
      </div>
    </form>
  );
}
