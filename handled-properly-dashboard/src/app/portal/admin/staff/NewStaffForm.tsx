"use client";

import { useActionState, useRef, useEffect } from "react";
import { inviteEventStaff, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewStaffForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(inviteEventStaff, null);
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
          <input id="name" name="name" required className={styles.input} placeholder="Jordan Lee" />
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
            placeholder="jordan@example.com"
          />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="phone">
          Phone <span className={styles.optional}>(optional)</span>
        </label>
        <input id="phone" name="phone" className={styles.input} placeholder="(555) 555-5555" />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Sending invite…">Invite Staff</SubmitButton>
      </div>
    </form>
  );
}
