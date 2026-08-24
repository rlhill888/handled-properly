"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateAssignment, deleteAssignment, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";
import type { StaffOption } from "./NewAssignmentForm";

export type AssignmentData = {
  id: string;
  title: string;
  description: string | null;
  status: "ready" | "in_progress" | "blocked" | "done";
  tags: string[];
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  pickupSetting: "admin_only" | "open_pickup";
  assigneeIds: string[];
  assigneeNames: string[];
};

export default function AssignmentCard({
  eventId,
  assignment,
  rosterStaff,
  isLocked,
}: {
  eventId: string;
  assignment: AssignmentData;
  rosterStaff: StaffOption[];
  isLocked: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const boundUpdate = updateAssignment.bind(null, eventId, assignment.id);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundUpdate, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && state === null) {
      setEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${assignment.title}"?`)) return;
    const result = await deleteAssignment(eventId, assignment.id);
    if (result?.error) alert(result.error);
  };

  if (!editing) {
    return (
      <div className={cardStyles.card}>
        <div className={cardStyles.cardHeader}>
          <span className={cardStyles.cardTitle}>{assignment.title}</span>
          <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
            {assignment.priority}
          </span>
        </div>
        {assignment.description && <p className={cardStyles.cardDescription}>{assignment.description}</p>}
        {assignment.tags.length > 0 && (
          <div className={styles.metaRow}>
            {assignment.tags.map((tag) => (
              <span key={tag} className={styles.pill}>
                {tag}
              </span>
            ))}
          </div>
        )}
        <div className={cardStyles.cardMeta}>
          {assignment.dueDate && <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>}
          <span>{assignment.pickupSetting === "open_pickup" ? "Open pickup" : "Admin-assigned"}</span>
        </div>
        {assignment.assigneeNames.length > 0 && (
          <div className={styles.metaRow}>
            {assignment.assigneeNames.map((name) => (
              <span key={name} className={styles.badgeMuted}>
                {name}
              </span>
            ))}
          </div>
        )}
        {!isLocked && (
          <div className={cardStyles.cardActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className={styles.dangerButton} onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cardStyles.card}>
      <form action={formAction} className={styles.form}>
        {state?.error && <p className={styles.error}>{state.error}</p>}

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input name="title" defaultValue={assignment.title} required className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            defaultValue={assignment.description ?? ""}
            className={styles.textarea}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Tags</label>
          <input name="tags" defaultValue={assignment.tags.join(", ")} className={styles.input} />
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Due date</label>
            <input
              name="due_date"
              type="date"
              defaultValue={assignment.dueDate ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select name="priority" defaultValue={assignment.priority} className={styles.select}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select name="status" defaultValue={assignment.status} className={styles.select}>
              <option value="ready">Ready to Work</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Pickup</span>
          <div className={styles.checkboxRow}>
            <label>
              <input
                type="radio"
                name="pickup_setting"
                value="admin_only"
                defaultChecked={assignment.pickupSetting === "admin_only"}
              />{" "}
              Admin assigns
            </label>
          </div>
          <div className={styles.checkboxRow}>
            <label>
              <input
                type="radio"
                name="pickup_setting"
                value="open_pickup"
                defaultChecked={assignment.pickupSetting === "open_pickup"}
              />{" "}
              Any roster staff can pick up
            </label>
          </div>
        </div>

        {rosterStaff.length > 0 && (
          <div className={styles.field}>
            <span className={styles.label}>Assignees</span>
            <div className={styles.metaRow}>
              {rosterStaff.map((staff) => (
                <label key={staff.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="assignee_ids"
                    value={staff.id}
                    defaultChecked={assignment.assigneeIds.includes(staff.id)}
                  />
                  {staff.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className={styles.actions}>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
