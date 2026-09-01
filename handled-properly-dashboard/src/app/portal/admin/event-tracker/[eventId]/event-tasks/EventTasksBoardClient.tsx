"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEventTaskUpdate, setEventTaskStatus, syncEventTaskDependencies } from "./actions";
import MultiSelectField from "@/components/portal/MultiSelectField";
import styles from "@/styles/admin-shared.module.css";
import commentStyles from "@/components/portal/CommentsSection.module.css";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export type EventTaskUpdateData = { id: string; body: string; createdAt: string };
export type EventTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  updates: EventTaskUpdateData[];
  blockingRequestIds: string[];
};
export type RequestOption = { id: string; label: string };

export default function EventTasksBoardClient({
  eventId,
  tasks,
  requestOptions,
  isLocked,
}: {
  eventId: string;
  tasks: EventTaskData[];
  requestOptions: RequestOption[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draftById, setDraftById] = useState<Record<string, string>>({});

  const handleStatusChange = (taskId: string, status: string) => {
    setError(null);
    startTransition(async () => {
      const result = await setEventTaskStatus(taskId, eventId, status as never);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const handlePostUpdate = (taskId: string) => {
    const body = draftById[taskId] ?? "";
    if (!body.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addEventTaskUpdate(taskId, eventId, body);
      if (result?.error) setError(result.error);
      else setDraftById((current) => ({ ...current, [taskId]: "" }));
      router.refresh();
    });
  };

  const handleDependenciesSubmit = (taskId: string, e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requestIds = new FormData(e.currentTarget).getAll("request_ids") as string[];
    setError(null);
    startTransition(async () => {
      const result = await syncEventTaskDependencies(taskId, eventId, requestIds);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  if (tasks.length === 0) {
    return <p className={styles.emptyState}>No event tasks yet.</p>;
  }

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.accordionList}>
        {tasks.map((task) => {
          const expanded = expandedId === task.id;
          return (
            <div key={task.id} className={styles.accordionItem}>
              <button
                type="button"
                className={styles.accordionHeader}
                onClick={() => setExpandedId(expanded ? null : task.id)}
                aria-expanded={expanded}
              >
                <span className={styles.accordionTitle}>{task.title}</span>
                <span className={task.status === "done" ? styles.badge : styles.badgeMuted}>
                  {STATUS_OPTIONS.find((o) => o.value === task.status)?.label ?? task.status}
                </span>
                <span
                  className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
                  aria-hidden="true"
                >
                  ▾
                </span>
              </button>

              {expanded && (
                <div className={styles.accordionBody}>
                  {task.description && <p>{task.description}</p>}

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor={`status-${task.id}`}>
                      Status
                    </label>
                    <select
                      id={`status-${task.id}`}
                      className={styles.select}
                      value={task.status}
                      disabled={isLocked || isPending}
                      onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <form
                    className={styles.form}
                    onSubmit={(e) => handleDependenciesSubmit(task.id, e)}
                  >
                    <MultiSelectField
                      name="request_ids"
                      label="Blocked on Requests"
                      helperText="won't let this task move to In Progress/Done until fulfilled"
                      options={requestOptions.map((r) => ({ id: r.id, label: r.label }))}
                      initialSelectedIds={task.blockingRequestIds}
                      placeholder="Add a blocking request…"
                      searchPlaceholder="Search requests…"
                    />
                    <div className={styles.actions}>
                      <button type="submit" className={styles.secondaryButton} disabled={isLocked || isPending}>
                        Save Dependencies
                      </button>
                    </div>
                  </form>

                  <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Updates</h2>
                    <div className={commentStyles.list}>
                      {task.updates.length === 0 && <p className={styles.emptyState}>No updates yet.</p>}
                      {task.updates.map((update) => (
                        <div key={update.id} className={commentStyles.comment}>
                          <div className={commentStyles.commentMeta}>
                            <span className={commentStyles.commentTime}>
                              {new Date(update.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className={commentStyles.commentBody}>{update.body}</p>
                        </div>
                      ))}
                    </div>
                    <div className={commentStyles.composer}>
                      <textarea
                        className={styles.textarea}
                        rows={2}
                        placeholder="Post an update…"
                        value={draftById[task.id] ?? ""}
                        onChange={(e) =>
                          setDraftById((current) => ({ ...current, [task.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className={styles.primaryButton}
                        disabled={isPending || !(draftById[task.id] ?? "").trim()}
                        onClick={() => handlePostUpdate(task.id)}
                      >
                        Post
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
