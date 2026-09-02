"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createAssignment, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import MultiSelectField from "@/components/portal/MultiSelectField";
import SingleSelectField from "@/components/portal/SingleSelectField";
import styles from "@/styles/admin-shared.module.css";

export type StaffOption = {
  id: string;
  name: string;
  categoryNames: string[];
  globalTagNames: string[];
};

export default function NewAssignmentForm({
  eventId,
  rosterStaff,
  existingAssignments = [],
  eventTasks = [],
  parentAssignmentId = null,
  submitLabel = "Create Assignment",
  onCreated,
}: {
  eventId: string;
  rosterStaff: StaffOption[];
  existingAssignments?: { id: string; title: string }[];
  eventTasks?: { id: string; title: string }[];
  parentAssignmentId?: string | null;
  submitLabel?: string;
  onCreated?: () => void;
}) {
  const boundAction = createAssignment.bind(null, eventId, parentAssignmentId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);
  // MultiSelectField tracks its own selection in React state, which
  // formRef.current.reset() (a native DOM reset) can't touch — bumping this
  // key remounts both fields after a successful create so they clear too.
  const [fieldsResetKey, setFieldsResetKey] = useState(0);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      setFieldsResetKey((k) => k + 1);
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
        <MultiSelectField
          key={`assignees-${fieldsResetKey}`}
          name="assignee_ids"
          label="Assignees"
          helperText="(optional)"
          options={rosterStaff.map((staff) => ({
            id: staff.id,
            label: staff.name,
            searchText: [...staff.categoryNames, ...staff.globalTagNames].join(" "),
          }))}
          placeholder="Add an assignee…"
          searchPlaceholder="Search staff or tag…"
        />
      )}

      {existingAssignments.length > 0 && (
        <MultiSelectField
          key={`depends-on-${fieldsResetKey}`}
          name="depends_on_ids"
          label="Depends on"
          helperText="(must be Done before this can start)"
          options={existingAssignments.map((a) => ({ id: a.id, label: a.title }))}
          placeholder="Add a dependency…"
          searchPlaceholder="Search assignments…"
        />
      )}

      {eventTasks.length > 0 && (
        <SingleSelectField
          key={`event-task-${fieldsResetKey}`}
          name="event_task_id"
          label="Event Task"
          helperText="(optional)"
          options={eventTasks.map((task) => ({ id: task.id, label: task.title }))}
          placeholder="Associate with an event task…"
          searchPlaceholder="Search event tasks…"
        />
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Creating…">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
