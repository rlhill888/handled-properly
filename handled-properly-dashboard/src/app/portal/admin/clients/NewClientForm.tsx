"use client";

import { useActionState, useRef, useEffect } from "react";
import { createClientRecord, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewClientForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createClientRecord, null);
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

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="name">
            Name
          </label>
          <input id="name" name="name" required className={styles.input} placeholder="Jane Doe" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={styles.input}
            placeholder="jane@example.com"
          />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="phone">
            Phone <span className={styles.optional}>(optional)</span>
          </label>
          <input id="phone" name="phone" className={styles.input} placeholder="(555) 555-5555" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="company_name">
            Company <span className={styles.optional}>(optional)</span>
          </label>
          <input id="company_name" name="company_name" className={styles.input} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="notes">
          Notes <span className={styles.optional}>(optional)</span>
        </label>
        <textarea id="notes" name="notes" className={styles.textarea} />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Client</SubmitButton>
      </div>
    </form>
  );
}
