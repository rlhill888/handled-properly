"use client";

import { useActionState, useRef, useEffect } from "react";
import { uploadDocumentation, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewDocumentationForm({ eventId }: { eventId: string }) {
  const boundAction = uploadDocumentation.bind(null, eventId);
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
        <label className={styles.label} htmlFor="documentation-title">
          Title
        </label>
        <input id="documentation-title" name="title" required className={styles.input} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="documentation-description">
          Description <span className={styles.optional}>optional</span>
        </label>
        <textarea id="documentation-description" name="description" className={styles.textarea} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="documentation-file">
          File
        </label>
        <input id="documentation-file" name="file" type="file" required className={styles.input} />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Uploading…">Upload</SubmitButton>
      </div>
    </form>
  );
}
