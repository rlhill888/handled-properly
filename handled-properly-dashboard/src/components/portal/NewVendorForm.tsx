"use client";

import { useActionState, useRef, useEffect } from "react";
import { createVendor, type ActionState } from "@/lib/actions/vendors";
import SubmitButton from "./SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewVendorForm({
  eventId,
  onCreated,
}: {
  eventId: string;
  onCreated?: () => void;
}) {
  const boundAction = createVendor.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      onCreated?.();
    }
    previousState.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="vendor-name">
            Name
          </label>
          <input id="vendor-name" name="name" required className={styles.input} placeholder="Acme Catering" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="vendor-email">
            Email
          </label>
          <input id="vendor-email" name="email" type="email" required className={styles.input} />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="vendor-phone">
          Phone <span className={styles.optional}>optional</span>
        </label>
        <input id="vendor-phone" name="phone" className={styles.input} />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Vendor</SubmitButton>
      </div>
    </form>
  );
}
