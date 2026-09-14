"use client";

import { useState } from "react";
import Link from "next/link";
import Modal from "@/components/portal/Modal";
import EventTaskUpdatesList, { type EventTaskUpdateData } from "@/components/portal/EventTaskUpdatesList";
import TaskStatusRing from "@/components/portal/TaskStatusRing";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

const STATUS_LABEL: Record<string, string> = {
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export type ClientBlockingRequest = { id: string; title: string };

export type ClientEventTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: "in_progress" | "blocked" | "done";
  updates: EventTaskUpdateData[];
  blockingRequests: ClientBlockingRequest[];
};

const COLUMNS: { status: ClientEventTaskData["status"]; label: string; description: string }[] = [
  { status: "in_progress", label: "In Progress", description: "Tasks currently being worked on." },
  { status: "blocked", label: "Blocked", description: "Tasks that are blocked currently." },
  { status: "done", label: "Done", description: "Finished tasks." },
];

// Clicking a task card opens its full details in a modal in place, rather
// than navigating to a separate page — mirrors the same change made to the
// Staff Assignments/Event Tasks boards.
export default function ClientEventTaskBoard({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: ClientEventTaskData[];
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
                <div className={boardStyles.columnHeaderTitle}>
                  <span>{column.label}</span>
                  <span className={boardStyles.columnDescription}>{column.description}</span>
                </div>
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

      <Modal open={openTask !== null} onClose={() => setOpenId(null)} title="Event Task">
        {openTask && (
          <div className={styles.form}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <TaskStatusRing status={openTask.status} size={40} />
              <h2 className={styles.cardHeading} style={{ marginBottom: 0, flex: 1 }}>
                {openTask.title}
              </h2>
              <span className={styles.taskStatusPill}>
                {STATUS_LABEL[openTask.status] ?? openTask.status}
              </span>
            </div>

            {openTask.description && (
              <p className={styles.description} style={{ marginBottom: 0, maxWidth: "none" }}>
                {openTask.description}
              </p>
            )}

            {openTask.blockingRequests.length > 0 && (
              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <h3 className={styles.cardTitle}>Blocked On</h3>
                <p className={styles.description}>This task is stuck until you finish these.</p>
                <div className={styles.metaRow}>
                  {openTask.blockingRequests.map((r) => (
                    <Link
                      key={r.id}
                      href={`/portal/client/events/${eventId}/requests/${r.id}`}
                      className={styles.pill}
                    >
                      {r.title} — not yet fulfilled
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <h3 className={styles.sectionHeading} style={{ marginBottom: 0 }}>
                  Updates
                </h3>
                {openTask.updates.length > 0 && (
                  <span className={boardStyles.countBubble}>{openTask.updates.length}</span>
                )}
              </div>
              <EventTaskUpdatesList updates={openTask.updates} />
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
