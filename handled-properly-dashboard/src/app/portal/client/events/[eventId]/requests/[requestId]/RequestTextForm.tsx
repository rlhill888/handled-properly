"use client";

import { useActionState } from "react";
import { submitRequestText, type ActionState } from "../../actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function RequestTextForm({
  requestId,
  defaultValue,
}: {
  requestId: string;
  defaultValue: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitRequestText.bind(null, requestId),
    null
  );

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}
      <div className={styles.field}>
        <label className={styles.label} htmlFor="response_text">
          Response
        </label>
        <textarea
          id="response_text"
          name="response_text"
          required
          className={styles.textarea}
          defaultValue={defaultValue ?? ""}
        />
      </div>
      <div className={styles.actions}>
        <SubmitButton pendingLabel="Submitting…">Submit</SubmitButton>
      </div>
    </form>
  );
}
