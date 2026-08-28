"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateAssignmentAssignees } from "./assignments/actions";
import type { AssignmentData } from "./assignments/AssignmentCard";
import type { StaffOption } from "./assignments/NewAssignmentForm";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

export default function AssignmentDetailView({
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
  const [assigneeIds, setAssigneeIds] = useState(assignment.assigneeIds);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const doneCount = assignment.children.filter((c) => c.status === "done").length;

  const toggleAssignee = (staffId: string) => {
    const next = assigneeIds.includes(staffId)
      ? assigneeIds.filter((id) => id !== staffId)
      : [...assigneeIds, staffId];
    setAssigneeIds(next);
    setError(null);
    startTransition(async () => {
      const result = await updateAssignmentAssignees(eventId, assignment.id, next);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className={cardStyles.detailView}>
      <div className={cardStyles.detailHeader}>
        <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
          {assignment.priority}
        </span>
        <Link
          href={`/portal/admin/event-tracker/${eventId}/assignments`}
          className={styles.backLink}
          aria-label={`Edit ${assignment.title}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
            />
          </svg>
        </Link>
      </div>

      {assignment.description && (
        <p className={cardStyles.cardDescription}>{assignment.description}</p>
      )}

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

      {error && <p className={styles.error}>{error}</p>}

      <div>
        <span className={styles.label}>Assignees</span>
        {rosterStaff.length === 0 ? (
          <p className={styles.emptyState}>No one is on this event&apos;s roster yet.</p>
        ) : (
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            {rosterStaff.map((staff) => (
              <label key={staff.id} className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={assigneeIds.includes(staff.id)}
                  disabled={isLocked || isPending}
                  onChange={() => toggleAssignee(staff.id)}
                />
                {staff.name}
              </label>
            ))}
          </div>
        )}
      </div>

      {assignment.attachedForms.length > 0 && (
        <div>
          <span className={styles.label}>Forms</span>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            {assignment.attachedForms.map((form) => (
              <span key={form.id} className={styles.pill}>
                {form.templateName}
              </span>
            ))}
          </div>
        </div>
      )}

      {assignment.children.length > 0 && (
        <div>
          <span className={styles.label}>
            Sub-assignments ({doneCount}/{assignment.children.length} done)
          </span>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            {assignment.children.map((child) => (
              <span key={child.id} className={styles.pill}>
                {child.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
