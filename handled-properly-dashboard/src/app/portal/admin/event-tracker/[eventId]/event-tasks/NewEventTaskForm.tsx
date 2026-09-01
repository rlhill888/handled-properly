"use client";

import { useActionState, useRef, useEffect } from "react";
import { createEventTask, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewEventTaskForm({
  eventId,
  onCreated,
}: {
  eventId: string;
  onCreated?: () => void;
}) {
  const boundAction = createEventTask.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      onCreated?.();
    }
    previousState.current = state;
  }, [state, onCreated]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="event-task-title">
          Title
        </label>
        <input id="event-task-title" name="title" required className={styles.input} />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="event-task-description">
          Description <span className={styles.optional}>optional</span>
        </label>
        <textarea id="event-task-description" name="description" className={styles.textarea} />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Event Task</SubmitButton>
      </div>
    </form>
  );
}
