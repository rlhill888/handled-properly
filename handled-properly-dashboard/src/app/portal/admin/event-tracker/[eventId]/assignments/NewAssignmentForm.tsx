"use client";

import { useActionState, useRef, useEffect } from "react";
import { createAssignment, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = { id: string; name: string };

export default function NewAssignmentForm({
  eventId,
  rosterStaff,
}: {
  eventId: string;
  rosterStaff: StaffOption[];
}) {
  const boundAction = createAssignment.bind(null, eventId);
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

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="title">
            Title
          </label>
          <input id="title" name="title" required className={styles.input} placeholder="Set up chairs" />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="tags">
            Tags <span className={styles.optional}>(comma-separated)</span>
          </label>
          <input id="tags" name="tags" className={styles.input} placeholder="Setup, Catering" />
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="description">
          Description <span className={styles.optional}>(optional)</span>
        </label>
        <textarea id="description" name="description" className={styles.textarea} />
      </div>

      <div className={styles.formRow}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="due_date">
            Due date <span className={styles.optional}>(optional)</span>
          </label>
          <input id="due_date" name="due_date" type="date" className={styles.input} />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="priority">
            Priority
          </label>
          <select id="priority" name="priority" defaultValue="medium" className={styles.select}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Pickup</span>
        <div className={styles.checkboxRow}>
          <label>
            <input type="radio" name="pickup_setting" value="admin_only" defaultChecked /> Admin
            assigns
          </label>
        </div>
        <div className={styles.checkboxRow}>
          <label>
            <input type="radio" name="pickup_setting" value="open_pickup" /> Any roster staff can
            pick up
          </label>
        </div>
      </div>

      {rosterStaff.length > 0 && (
        <div className={styles.field}>
          <span className={styles.label}>Assignees <span className={styles.optional}>(optional)</span></span>
          <div className={styles.metaRow}>
            {rosterStaff.map((staff) => (
              <label key={staff.id} className={styles.checkboxRow}>
                <input type="checkbox" name="assignee_ids" value={staff.id} />
                {staff.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Creating…">Create Assignment</SubmitButton>
      </div>
    </form>
  );
}
