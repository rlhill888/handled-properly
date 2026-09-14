"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/portal/Modal";
import EventTaskUpdatesList, { type EventTaskUpdateData } from "@/components/portal/EventTaskUpdatesList";
import ClipboardIcon from "@/components/portal/ClipboardIcon";
import CommentIcon from "@/components/portal/CommentIcon";
import ChevronRightIcon from "@/components/portal/ChevronRightIcon";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";
import detailStyles from "./StaffEventTaskBoard.module.css";

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export type TaskLinkedAssignment = {
  id: string;
  title: string;
  description: string | null;
  status: "in_progress" | "blocked" | "done";
  dueDate: string | null;
  assigneeNames: string[];
};

export type StaffEventTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: "in_progress" | "blocked" | "done";
  updates: EventTaskUpdateData[];
  linkedAssignments: TaskLinkedAssignment[];
};

const COLUMNS: { status: StaffEventTaskData["status"]; label: string }[] = [
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

// Read-only, same as ClientEventTaskBoard — only the admin ever moves an
// Event Task, so Staff just sees the same board the Client sees. Clicking a
// card opens its full details in a modal in place, rather than navigating
// to a separate page. Each linked Staff Assignment in that modal links out
// to its own detail page instead of opening yet another nested modal.
export default function StaffEventTaskBoard({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: StaffEventTaskData[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const openTask = tasks.find((t) => t.id === openId) ?? null;

  if (tasks.length === 0) {
    return <p className={styles.emptyState}>No event tasks yet.</p>;
  }

  return (
    <>
      <div className={boardStyles.board}>
        {COLUMNS.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.status);
          return (
            <div key={column.status} className={boardStyles.column}>
              <div className={boardStyles.columnHeader}>
                <span>{column.label}</span>
                <span>{columnTasks.length}</span>
              </div>
              <div className={boardStyles.taskGrid}>
                {columnTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className={boardStyles.squareCard}
                    style={{ textAlign: "left", font: "inherit", cursor: "pointer" }}
                    onClick={() => setOpenId(task.id)}
                  >
                    <div className={boardStyles.cardHeader}>
                      <span
                        className={`${boardStyles.cardTitle} ${
                          task.status === "done" ? boardStyles.cardTitleDone : ""
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>
                    {task.description && (
                      <p className={boardStyles.squareCardDescription}>{task.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={openTask !== null}
        onClose={() => setOpenId(null)}
        title={openTask?.title ?? "Event Task"}
        titleVariant="heading"
      >
        {openTask && (
          <div className={styles.form}>
            <span className={detailStyles.statusPill}>
              {STATUS_LABEL[openTask.status] ?? openTask.status}
            </span>

            {openTask.description && <p className={detailStyles.description}>{openTask.description}</p>}

            {openTask.linkedAssignments.length > 0 && (
              <div className={detailStyles.section}>
                <div className={detailStyles.sectionHeader}>
                  Staff assignments for this task
                  <span className={styles.countBubble}>{openTask.linkedAssignments.length}</span>
                </div>
                {openTask.linkedAssignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/portal/staff/events/${eventId}/assignments/${assignment.id}`}
                    className={detailStyles.assignmentRow}
                  >
                    <span className={detailStyles.assignmentRowLabel}>
                      <span className={detailStyles.assignmentRowIcon}>
                        <ClipboardIcon size={18} />
                      </span>
                      <span className={detailStyles.assignmentRowText}>
                        <span className={detailStyles.assignmentRowTitle}>{assignment.title}</span>
                        {assignment.description && (
                          <span className={detailStyles.assignmentRowSubtitle}>{assignment.description}</span>
                        )}
                      </span>
                    </span>
                    <ChevronRightIcon size={16} className={detailStyles.assignmentRowChevron} />
                  </Link>
                ))}
              </div>
            )}

            <div className={detailStyles.section}>
              <div className={detailStyles.sectionHeader}>
                Updates
                <span className={styles.countBubble}>{openTask.updates.length}</span>
              </div>
              {openTask.updates.length === 0 ? (
                <div className={detailStyles.emptyBox}>
                  <span className={detailStyles.emptyBoxIcon}>
                    <CommentIcon size={20} />
                  </span>
                  <div>
                    <div className={detailStyles.emptyBoxTitle}>No updates yet</div>
                    <div className={detailStyles.emptyBoxSubtitle}>Task updates will appear here.</div>
                  </div>
                </div>
              ) : (
                <EventTaskUpdatesList updates={openTask.updates} />
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
