"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createRequest, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewRequestForm({ eventId }: { eventId: string }) {
  const boundAction = createRequest.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);
  const [requiresFile, setRequiresFile] = useState(false);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      setRequiresFile(false);
    }
    previousState.current = state;
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="request-title">
          Title
        </label>
        <input id="request-title" name="title" required className={styles.input} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="request-description">
          Description <span className={styles.optional}>optional</span>
        </label>
        <textarea id="request-description" name="description" className={styles.textarea} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="request-due-date">
          Due date <span className={styles.optional}>optional</span>
        </label>
        <input id="request-due-date" name="due_date" type="date" className={styles.input} />
      </div>

      <div className={styles.checkboxRow}>
        <input
          id="request-requires-file"
          name="requires_file"
          type="checkbox"
          checked={requiresFile}
          onChange={(e) => setRequiresFile(e.target.checked)}
        />
        <label htmlFor="request-requires-file">Requires a file upload</label>
      </div>

      {requiresFile && (
        <div className={styles.field}>
          <label className={styles.label} htmlFor="request-fulfillment-setting">
            Fulfillment
          </label>
          <select id="request-fulfillment-setting" name="fulfillment_setting" className={styles.select} defaultValue="manual_review">
            <option value="manual_review">Admin reviews upload before marking fulfilled</option>
            <option value="auto">Fulfilled automatically as soon as the client uploads</option>
          </select>
        </div>
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Request</SubmitButton>
      </div>
    </form>
  );
}
