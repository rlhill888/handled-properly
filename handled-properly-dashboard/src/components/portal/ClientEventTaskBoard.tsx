import Link from "next/link";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

export type ClientEventTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "blocked" | "done";
};

const COLUMNS: { status: ClientEventTaskData["status"]; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export default function ClientEventTaskBoard({
  eventId,
  tasks,
}: {
  eventId: string;
  tasks: ClientEventTaskData[];
}) {
  if (tasks.length === 0) {
    return <p className={styles.emptyState}>No event tasks yet.</p>;
  }

  return (
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
                <Link
                  key={task.id}
                  href={`/portal/client/events/${eventId}/tasks/${task.id}`}
                  className={boardStyles.squareCard}
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
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
