"use client";

import { useState, useTransition } from "react";
import { staffSetStatus, staffPickupAssignment } from "./actions";
import CommentsSection from "@/components/portal/CommentsSection";
import CalendarIcon from "@/components/portal/CalendarIcon";
import LockIcon from "@/components/portal/LockIcon";
import PersonIcon from "@/components/portal/PersonIcon";
import SelectDropdown from "@/components/portal/SelectDropdown";
import { addAssignmentComment, type CommentData } from "@/lib/actions/assignment-comments";
import type { DependencyRef } from "@/lib/data/assignment-dependencies";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";
import detailStyles from "./StaffAssignmentCard.module.css";

export type StaffAssignmentData = {
  id: string;
  title: string;
  description: string | null;
  status: "in_progress" | "blocked" | "done";
  dueDate: string | null;
  priority: "low" | "medium" | "high";
  pickupSetting: "admin_only" | "open_pickup";
  assigneeIds: string[];
  assigneeNames: string[];
  comments: CommentData[];
  dependsOn: DependencyRef[];
  blocks: DependencyRef[];
  subtasks: StaffAssignmentData[];
};

const STATUS_OPTIONS: { value: StaffAssignmentData["status"]; label: string }[] = [
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

// No existing color convention for assignment_status elsewhere in the app —
// reuses the exact hex values already established for the same meanings on
// priority/dependency pills (amber/red) and the Kanban "Assigned to You"
// badge (green), rather than inventing a new palette.
const STATUS_DOT_COLORS: Record<StaffAssignmentData["status"], string> = {
  in_progress: "#92400e",
  blocked: "#b91c1c",
  done: "#0a7c2f",
};

// An assignment a staff member can't pick up (admin_only) and isn't
// assigned to is view-only for them: they still see it for context (per the
// board's existing "every assignment is shown" convention) but can't move
// its status — only Roster members who could plausibly act on it can.
export function isRestrictedForStaff(
  assignment: Pick<StaffAssignmentData, "pickupSetting" | "assigneeIds">,
  currentStaffId: string | null
): boolean {
  return (
    assignment.pickupSetting !== "open_pickup" &&
    !(currentStaffId && assignment.assigneeIds.includes(currentStaffId))
  );
}

// "Priya Nandan" -> "PN"; a single-word name just takes its first two
// letters so the avatar circle never ends up empty.
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

  const doneCount = assignment.subtasks.filter((c) => c.status === "done").length;
  const hasSubtasks = assignment.subtasks.length > 0;

  const isAlreadyAssigned = Boolean(currentStaffId && assignment.assigneeIds.includes(currentStaffId));
  const canPickUp = assignment.pickupSetting === "open_pickup" && !isAlreadyAssigned && !isLocked;
  const hasUnmetDependencies = assignment.dependsOn.some((dep) => dep.status !== "done");
  const isRestricted = isRestrictedForStaff(assignment, currentStaffId);

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

  const showRestrictedNotice = () =>
    setError("This assignment isn't assigned to you, so you can't change it.");

  return (
    <div className={cardStyles.card}>
      <div className={cardStyles.cardHeader}>
        <span className={cardStyles.cardTitleLg}>
          {isAlreadyAssigned && (
            <span className={cardStyles.assignedToMeIcon} aria-label="Assigned to you">
              <PersonIcon size={12} />
            </span>
          )}{" "}
          {assignment.title}
        </span>
        <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
          {assignment.priority}
        </span>
      </div>
      {assignment.description && <p className={cardStyles.cardDescription}>{assignment.description}</p>}

      <div className={cardStyles.assigneesBlock}>
        <span className={cardStyles.metaLabel}>Status</span>
        <div className={cardStyles.restrictedWrap}>
          <SelectDropdown
            options={STATUS_OPTIONS.filter(
              // A blocked-by-dependency option is hidden rather than shown
              // disabled (SelectDropdown has no per-option disabled state) —
              // except the assignment's own current status, which must stay
              // selectable so the trigger still shows it rather than falling
              // back to the placeholder.
              (opt) =>
                opt.value === assignment.status ||
                !(hasUnmetDependencies && (opt.value === "in_progress" || opt.value === "done"))
            ).map((opt) => ({ id: opt.value, label: opt.label, dotColor: STATUS_DOT_COLORS[opt.value] }))}
            value={assignment.status}
            onChange={(value) => handleStatusChange(value as StaffAssignmentData["status"])}
            placeholder="Set status…"
            disabled={isLocked || isPending || isRestricted}
          />
          {/* The dropdown above is already inert (disabled) when restricted —
              this transparent layer sits on top so the click that would
              otherwise land on nothing instead surfaces why. */}
          {isRestricted && !isLocked && (
            <button
              type="button"
              className={cardStyles.restrictedOverlay}
              onClick={showRestrictedNotice}
              aria-label="This assignment isn't assigned to you"
            />
          )}
        </div>
      </div>

      {!isLocked && canPickUp && (
        <div className={cardStyles.cardActions}>
          <button type="button" className={styles.secondaryButton} disabled={isPending} onClick={handlePickup}>
            Pick Up
          </button>
        </div>
      )}

      <div className={cardStyles.assigneesBlock}>
        <span className={cardStyles.metaLabel}>Assigned to</span>
        {assignment.assigneeNames.length > 0 ? (
          <div className={detailStyles.avatarRow}>
            {assignment.assigneeNames.map((name) => (
              <span key={name} className={detailStyles.avatarChip}>
                <span className={detailStyles.avatarCircle}>{getInitials(name)}</span>
                <span className={detailStyles.avatarName}>{name}</span>
              </span>
            ))}
          </div>
        ) : (
          <span className={cardStyles.cardMeta}>No one yet</span>
        )}
      </div>

      {assignment.dependsOn.length > 0 && (
        <div className={cardStyles.assigneesBlock}>
          <span className={cardStyles.metaLabel} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {hasUnmetDependencies && (
              <span style={{ color: "#b91c1c", display: "inline-flex" }}>
                <LockIcon size={11} />
              </span>
            )}
            Waiting on
          </span>
          <div className={styles.metaRow}>
            {assignment.dependsOn.map((dep) => (
              <span key={dep.id} className={dep.status === "done" ? cardStyles.depDone : cardStyles.depPending}>
                {dep.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {assignment.blocks.length > 0 && (
        <div className={cardStyles.assigneesBlock}>
          <span className={cardStyles.metaLabel}>Blocking</span>
          <div className={styles.metaRow}>
            {assignment.blocks.map((b) => (
              <span key={b.id} className={cardStyles.depBlocking}>
                {b.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {hasSubtasks && (
        <div className={cardStyles.subSection}>
          <div className={cardStyles.subHeaderRow}>
            <span className={cardStyles.cardTitle}>Subtasks</span>
            <span className={cardStyles.cardMeta}>
              {doneCount} / {assignment.subtasks.length} completed
            </span>
          </div>
          <div className={cardStyles.subList}>
            {assignment.subtasks.map((child) => (
              <StaffSubtaskAccordion
                key={child.id}
                eventId={eventId}
                assignment={child}
                currentStaffId={currentStaffId}
                isLocked={isLocked}
              />
            ))}
          </div>
        </div>
      )}

      <CommentsSection
        initialComments={assignment.comments}
        onPost={(body) => addAssignmentComment(assignment.id, body)}
      />

      <div className={cardStyles.assigneesBlock}>
        <span className={cardStyles.metaLabel}>Due date</span>
        <div className={cardStyles.dueDateBox}>
          <CalendarIcon size={14} />
          {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
        </div>
      </div>
    </div>
  );
}

// A collapsed row for one Subtask (checkbox + title + priority, expanding in
// place into the full StaffAssignmentCard) — same per-item accordion
// pattern already used for Subtasks on the admin AssignmentCard, instead of
// one toggle for the whole Subtasks section.
function StaffSubtaskAccordion({
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
  const [expanded, setExpanded] = useState(false);
  const [isToggling, startToggle] = useTransition();
  const [toggleError, setToggleError] = useState<string | null>(null);
  const isBlocked = assignment.dependsOn.some((dep) => dep.status !== "done");
  const isRestricted = isRestrictedForStaff(assignment, currentStaffId);

  const handleToggleComplete = () => {
    const nextStatus = assignment.status === "done" ? "in_progress" : "done";
    setToggleError(null);
    startToggle(async () => {
      const result = await staffSetStatus(eventId, assignment.id, nextStatus);
      if (result?.error) setToggleError(result.error);
    });
  };

  if (expanded) {
    return (
      <div>
        <button type="button" className={cardStyles.subToggle} onClick={() => setExpanded(false)}>
          ▾ Collapse
        </button>
        <StaffAssignmentCard
          eventId={eventId}
          assignment={assignment}
          currentStaffId={currentStaffId}
          isLocked={isLocked}
        />
      </div>
    );
  }

  return (
    <div>
      <div className={cardStyles.subAccordionHeader}>
        <div className={cardStyles.restrictedWrap}>
          <label className={cardStyles.completeToggle}>
            <input
              type="checkbox"
              checked={assignment.status === "done"}
              disabled={isLocked || isToggling || isRestricted}
              onChange={handleToggleComplete}
              aria-label={
                assignment.status === "done"
                  ? `Mark "${assignment.title}" incomplete`
                  : `Mark "${assignment.title}" complete`
              }
            />
          </label>
          {isRestricted && !isLocked && (
            <button
              type="button"
              className={cardStyles.restrictedOverlay}
              onClick={() =>
                setToggleError("This assignment isn't assigned to you, so you can't change it.")
              }
              aria-label="This assignment isn't assigned to you"
            />
          )}
        </div>
        <button
          type="button"
          className={cardStyles.subAccordionTitleButton}
          onClick={() => setExpanded(true)}
        >
          <span
            className={`${cardStyles.cardTitle} ${
              assignment.status === "done" ? cardStyles.cardTitleDone : ""
            }`}
          >
            {isBlocked && (
              <span className={cardStyles.titleCardBlockedIcon} aria-label="Blocked">
                <LockIcon size={12} />
              </span>
            )}{" "}
            {assignment.title}
          </span>
          <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
            {assignment.priority}
          </span>
          <span className={cardStyles.subAccordionChevron} aria-hidden>
            ▸
          </span>
        </button>
      </div>
      {toggleError && <p className={styles.error}>{toggleError}</p>}
    </div>
  );
}
