"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

const STATUS_LABEL: Record<string, string> = {
  ready: "Ready to Work",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export type TaskLinkedAssignment = {
  id: string;
  title: string;
  description: string | null;
  status: "ready" | "in_progress" | "blocked" | "done";
  tags: string[];
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  assigneeNames: string[];
};

// Read-only — staff already has the full interactive Assignment (drag,
// comments, pickup) on the Assignments board itself. This is just a peek
// from within an Event Task, to see what the linked work actually is.
export default function TaskAssignmentCards({ assignments }: { assignments: TaskLinkedAssignment[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openAssignment = assignments.find((a) => a.id === openId) ?? null;

  return (
    <>
      <div className={boardStyles.taskGrid}>
        {assignments.map((assignment) => (
          <button
            key={assignment.id}
            type="button"
            className={boardStyles.squareCard}
            style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}
            onClick={() => setOpenId(assignment.id)}
          >
            <div className={boardStyles.cardHeader}>
              <span
                className={`${boardStyles.cardTitle} ${
                  assignment.status === "done" ? boardStyles.cardTitleDone : ""
                }`}
              >
                {assignment.title}
              </span>
            </div>
            {assignment.description && (
              <p className={boardStyles.squareCardDescription}>{assignment.description}</p>
            )}
          </button>
        ))}
      </div>

      <Modal open={openAssignment !== null} onClose={() => setOpenId(null)} title="Assignment">
        {openAssignment && (
          <div className={styles.form}>
            <div className={styles.metaRow}>
              <span className={openAssignment.status === "done" ? styles.badge : styles.badgeMuted}>
                {STATUS_LABEL[openAssignment.status] ?? openAssignment.status}
              </span>
              <span className={styles.pill}>{PRIORITY_LABEL[openAssignment.priority]} priority</span>
              {openAssignment.tags.map((tag) => (
                <span key={tag} className={styles.pill}>
                  {tag}
                </span>
              ))}
            </div>

            {openAssignment.description && <p>{openAssignment.description}</p>}

            <table className={`${styles.table} ${styles.keyValueTable}`}>
              <tbody>
                <tr>
                  <td>Due</td>
                  <td>{openAssignment.dueDate ? new Date(openAssignment.dueDate).toLocaleDateString() : "—"}</td>
                </tr>
                <tr>
                  <td>Assigned to</td>
                  <td>
                    {openAssignment.assigneeNames.length > 0
                      ? openAssignment.assigneeNames.join(", ")
                      : "Unassigned"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </>
  );
}
