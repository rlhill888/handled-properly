"use client";

import { useActionState, useRef, useEffect } from "react";
import { createContact, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewContactForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createContact, null);
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
          <label className={styles.label} htmlFor="contact-name">
            Name
          </label>
          <input id="contact-name" name="name" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-email">
            Email
          </label>
          <input id="contact-email" name="email" type="email" required className={styles.input} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="contact-phone">
            Phone <span className={styles.optional}>(optional)</span>
          </label>
          <input id="contact-phone" name="phone" className={styles.input} />
        </div>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Contact</SubmitButton>
      </div>
    </form>
  );
}
