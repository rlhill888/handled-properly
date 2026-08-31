"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { staffSetStatus, staffPickupAssignment } from "./actions";
import CommentsSection from "@/components/portal/CommentsSection";
import LockIcon from "@/components/portal/LockIcon";
import type { CommentData } from "@/lib/actions/assignment-comments";
import type { DependencyRef } from "@/lib/data/assignment-dependencies";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

export type StaffAssignmentData = {
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
  visibleForms: { id: string; name: string }[];
  comments: CommentData[];
  dependsOn: DependencyRef[];
  blocks: DependencyRef[];
  subtasks: StaffAssignmentData[];
};

const STATUS_OPTIONS: { value: StaffAssignmentData["status"]; label: string }[] = [
  { value: "ready", label: "Ready to Work" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

export default function StaffAssignmentCard({
  eventId,
  assignment,
  currentStaffId,
  isLocked,
}: {
  eventId: string;
  assignment: StaffAssignmentData;
  currentStaffId: string | null;
  isLocked: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [subtasksExpanded, setSubtasksExpanded] = useState(true);

  const doneCount = assignment.subtasks.filter((c) => c.status === "done").length;
  const hasSubtasks = assignment.subtasks.length > 0;

  const isAlreadyAssigned = Boolean(currentStaffId && assignment.assigneeIds.includes(currentStaffId));
  const canPickUp = assignment.pickupSetting === "open_pickup" && !isAlreadyAssigned && !isLocked;
  const hasUnmetDependencies = assignment.dependsOn.some((dep) => dep.status !== "done");

  const handleStatusChange = (status: StaffAssignmentData["status"]) => {
    setError(null);
    startTransition(async () => {
      const result = await staffSetStatus(eventId, assignment.id, status);
      if (result?.error) setError(result.error);
    });
  };

  const handlePickup = () => {
    setError(null);
    startTransition(async () => {
      const result = await staffPickupAssignment(eventId, assignment.id);
      if (result?.error) setError(result.error);
    });
  };

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
      <span className={cardStyles.cardMeta}>
        {[
          assignment.dueDate && `Due ${new Date(assignment.dueDate).toLocaleDateString()}`,
          assignment.pickupSetting === "open_pickup" ? "Open pickup" : "Assigned",
        ]
          .filter(Boolean)
          .join(" · ")}
      </span>
      {assignment.assigneeNames.length > 0 && (
        <div className={styles.metaRow}>
          {assignment.assigneeNames.map((name) => (
            <span key={name} className={styles.badgeMuted}>
              {name}
            </span>
          ))}
        </div>
      )}

      {assignment.visibleForms.length > 0 && (
        <div className={styles.metaRow}>
          {assignment.visibleForms.map((form) => (
            <Link key={form.id} href={`/portal/staff/form-results/${form.id}`} className={styles.pill}>
              {form.name} — View results
            </Link>
          ))}
        </div>
      )}

      {assignment.dependsOn.length > 0 && (
        <div className={styles.metaRow}>
          {assignment.dependsOn.map((dep) => (
            <span key={dep.id} className={dep.status === "done" ? cardStyles.depDone : cardStyles.depPending}>
              {dep.status !== "done" && <LockIcon size={10} />}
              Waiting on: {dep.title}
            </span>
          ))}
        </div>
      )}

      {assignment.blocks.length > 0 && (
        <div className={styles.metaRow}>
          {assignment.blocks.map((b) => (
            <span key={b.id} className={cardStyles.depBlocking}>
              Blocking: {b.title}
            </span>
          ))}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!isLocked && (
        <div className={cardStyles.cardActions}>
          <select
            className={styles.select}
            value={assignment.status}
            disabled={isPending}
            onChange={(e) => handleStatusChange(e.target.value as StaffAssignmentData["status"])}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={hasUnmetDependencies && (opt.value === "in_progress" || opt.value === "done")}
              >
                {opt.label}
              </option>
            ))}
          </select>
          {canPickUp && (
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isPending}
              onClick={handlePickup}
            >
              Pick Up
            </button>
          )}
        </div>
      )}

      {hasSubtasks && (
        <div className={cardStyles.subSection}>
          <button
            type="button"
            className={cardStyles.subToggle}
            onClick={() => setSubtasksExpanded((e) => !e)}
          >
            {subtasksExpanded ? "▾" : "▸"} Subtasks ({doneCount}/{assignment.subtasks.length} done)
          </button>
          {subtasksExpanded && (
            <div className={cardStyles.subList}>
              {assignment.subtasks.map((child) => (
                <StaffAssignmentCard
                  key={child.id}
                  eventId={eventId}
                  assignment={child}
                  currentStaffId={currentStaffId}
                  isLocked={isLocked}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <CommentsSection assignmentId={assignment.id} initialComments={assignment.comments} />
    </div>
  );
}
