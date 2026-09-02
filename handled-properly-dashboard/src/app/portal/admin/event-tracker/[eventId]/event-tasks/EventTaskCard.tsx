"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addEventTaskUpdate,
  setEventTaskStatus,
  syncEventTaskDependencies,
  syncEventTaskAssignments,
} from "./actions";
import MultiSelectField from "@/components/portal/MultiSelectField";
import styles from "@/styles/admin-shared.module.css";
import commentStyles from "@/components/portal/CommentsSection.module.css";
import type { EventTaskData, RequestOption, AssignmentOption } from "./EventTasksBoardClient";

const STATUS_OPTIONS: { value: EventTaskData["status"]; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

// The modal opened from a board card — mirrors AssignmentCard's role for
// the Assignments board. Status can still be changed here (a select,
// exactly like Assignment's edit form keeps one alongside its own board
// drag), as a non-drag fallback.
export default function EventTaskCard({
  eventId,
  task,
  requestOptions,
  assignmentOptions,
  isLocked,
}: {
  eventId: string;
  task: EventTaskData;
  requestOptions: RequestOption[];
  assignmentOptions: AssignmentOption[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState("");

  const handleStatusChange = (status: EventTaskData["status"]) => {
    setError(null);
    startTransition(async () => {
      const result = await setEventTaskStatus(task.id, eventId, status);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const handlePostUpdate = () => {
    if (!draft.trim()) return;
    setError(null);
    startTransition(async () => {
      const result = await addEventTaskUpdate(task.id, eventId, draft);
      if (result?.error) setError(result.error);
      else setDraft("");
      router.refresh();
    });
  };

  const handleDependenciesChange = (requestIds: string[]) => {
    setError(null);
    startTransition(async () => {
      const result = await syncEventTaskDependencies(task.id, eventId, requestIds);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  const handleAssignmentsChange = (assignmentIds: string[]) => {
    setError(null);
    startTransition(async () => {
      const result = await syncEventTaskAssignments(task.id, eventId, assignmentIds);
      if (result?.error) setError(result.error);
      router.refresh();
    });
  };

  return (
    <div className={styles.form}>
      {error && <p className={styles.error}>{error}</p>}

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
          onChange={(e) => handleStatusChange(e.target.value as EventTaskData["status"])}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className={styles.cardTitle}>Updates</h2>
        <div className={commentStyles.list}>
          {task.updates.length === 0 && <p className={styles.emptyState}>No updates yet.</p>}
          {task.updates.map((update) => (
            <div key={update.id} className={commentStyles.comment}>
              <div className={commentStyles.commentMeta}>
                <span className={commentStyles.commentTime}>{new Date(update.createdAt).toLocaleString()}</span>
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
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            type="button"
            className={styles.primaryButton}
            disabled={isPending || !draft.trim()}
            onClick={handlePostUpdate}
          >
            Post
          </button>
        </div>
      </div>

      <MultiSelectField
        name="request_ids"
        label="Set a request to block this event task"
        options={requestOptions}
        initialSelectedIds={task.blockingRequests.map((r) => r.id)}
        placeholder="Add a blocking request…"
        searchPlaceholder="Search requests…"
        onSelectionChange={isLocked ? undefined : handleDependenciesChange}
      />

      <MultiSelectField
        name="assignment_ids"
        label="Associated assignments"
        helperText="the staff-side work behind this event task — visible to staff"
        options={assignmentOptions}
        initialSelectedIds={task.linkedAssignments.map((a) => a.id)}
        placeholder="Add an assignment…"
        searchPlaceholder="Search assignments…"
        onSelectionChange={isLocked ? undefined : handleAssignmentsChange}
      />
    </div>
  );
}
