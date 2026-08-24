"use client";

import { useState, useTransition } from "react";
import { staffSetStatus, staffPickupAssignment } from "./actions";
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

  const isAlreadyAssigned = Boolean(currentStaffId && assignment.assigneeIds.includes(currentStaffId));
  const canPickUp = assignment.pickupSetting === "open_pickup" && !isAlreadyAssigned && !isLocked;

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
              <option key={opt.value} value={opt.value}>
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
    </div>
  );
}
