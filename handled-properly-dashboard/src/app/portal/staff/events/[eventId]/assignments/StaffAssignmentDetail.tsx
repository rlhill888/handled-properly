"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { staffSetStatus, staffPickupAssignment } from "./actions";
import { isRestrictedForStaff, type StaffAssignmentData } from "./StaffAssignmentCard";
import CommentsSection from "@/components/portal/CommentsSection";
import CalendarIcon from "@/components/portal/CalendarIcon";
import LockIcon from "@/components/portal/LockIcon";
import LinkIcon from "@/components/portal/LinkIcon";
import ChevronRightIcon from "@/components/portal/ChevronRightIcon";
import SelectDropdown from "@/components/portal/SelectDropdown";
import { addAssignmentComment } from "@/lib/actions/assignment-comments";
import { getInitials } from "@/lib/get-initials";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";
import detailStyles from "./StaffAssignmentCard.module.css";

const STATUS_OPTIONS: { value: StaffAssignmentData["status"]; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

const STATUS_DOT_COLORS: Record<StaffAssignmentData["status"], string> = {
  not_started: "#6b7280",
  in_progress: "#92400e",
  blocked: "#b91c1c",
  done: "#0a7c2f",
};

// The standalone per-assignment page's own presentation (linked from the
// staff dashboard's "Your Assignments" cards) — deliberately a separate
// component from StaffAssignmentCard rather than a shared one, since that
// card's compact layout is also used inline in the Kanban board's modal and
// shouldn't change there just because this page wants a roomier one.
export default function StaffAssignmentDetail({
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

  // Grouped by vendor, in first-seen order — matches the admin's own
  // "Vendor requested items" card so an item's vendor reads the same way in
  // both places.
  const vendorNeedGroups: { vendorName: string; needs: StaffAssignmentData["vendorNeeds"] }[] = [];
  for (const need of assignment.vendorNeeds) {
    const group = vendorNeedGroups.find((g) => g.vendorName === need.vendorName);
    if (group) group.needs.push(need);
    else vendorNeedGroups.push({ vendorName: need.vendorName, needs: [need] });
  }

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
    <div className={detailStyles.card}>
      <div>
        <span className={assignment.status === "done" ? detailStyles.titleDone : detailStyles.title}>
          {assignment.title}
        </span>
        {assignment.description && (
          <p className={detailStyles.description}>{assignment.description}</p>
        )}
      </div>

      <div className={detailStyles.fieldGrid}>
        <div className={detailStyles.field}>
          <span className={detailStyles.fieldLabel}>Status</span>
          <div className={cardStyles.restrictedWrap} style={{ width: "100%" }}>
            <SelectDropdown
              options={STATUS_OPTIONS.filter(
                (opt) =>
                  opt.value === assignment.status ||
                  !(hasUnmetDependencies && (opt.value === "in_progress" || opt.value === "done"))
              ).map((opt) => ({ id: opt.value, label: opt.label, dotColor: STATUS_DOT_COLORS[opt.value] }))}
              value={assignment.status}
              onChange={(value) => handleStatusChange(value as StaffAssignmentData["status"])}
              placeholder="Set status…"
              disabled={isLocked || isPending || isRestricted}
            />
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

        <div className={detailStyles.field}>
          <span className={detailStyles.fieldLabel}>Due date</span>
          <div className={detailStyles.dueDateBox}>
            <CalendarIcon size={16} />
            {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
          </div>
        </div>
      </div>

      {!isLocked && canPickUp && (
        <div className={cardStyles.cardActions}>
          <button type="button" className={styles.secondaryButton} disabled={isPending} onClick={handlePickup}>
            Pick Up
          </button>
        </div>
      )}

      <div className={detailStyles.field}>
        <span className={detailStyles.fieldLabel}>Assigned to</span>
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

      {error && <p className={styles.error}>{error}</p>}

      {assignment.dependsOn.length > 0 && (
        <div className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            Dependencies
            <span className={styles.countBubble}>{assignment.dependsOn.length}</span>
          </div>
          {assignment.dependsOn.map((dep) => (
            <Link
              key={dep.id}
              href={`/portal/staff/events/${eventId}/assignments/${dep.id}`}
              className={detailStyles.linkRow}
            >
              <span className={dep.status === "done" ? detailStyles.linkRowLabelDone : detailStyles.linkRowLabel}>
                <LinkIcon size={14} />
                {dep.title}
              </span>
              <ChevronRightIcon size={16} className={detailStyles.linkRowChevron} />
            </Link>
          ))}
        </div>
      )}

      {assignment.blocks.length > 0 && (
        <div className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            Blocking
            <span className={styles.countBubble}>{assignment.blocks.length}</span>
          </div>
          {assignment.blocks.map((b) => (
            <Link
              key={b.id}
              href={`/portal/staff/events/${eventId}/assignments/${b.id}`}
              className={detailStyles.linkRow}
            >
              <span className={b.status === "done" ? detailStyles.linkRowLabelDone : detailStyles.linkRowLabel}>
                <LinkIcon size={14} />
                {b.title}
              </span>
              <ChevronRightIcon size={16} className={detailStyles.linkRowChevron} />
            </Link>
          ))}
        </div>
      )}

      {assignment.vendorNeeds.length > 0 && (
        <div className={detailStyles.section}>
          <div className={detailStyles.sectionHeader}>
            Vendor requested items
            <span className={styles.countBubble}>{assignment.vendorNeeds.length}</span>
          </div>
          <div className={styles.accordionItem}>
            {vendorNeedGroups.map((group) => (
              <div key={group.vendorName}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 16px",
                    background: "var(--surface)",
                    borderBottom: "1px solid var(--border)",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  {group.vendorName}
                  <span className={styles.optional}>
                    {group.needs.length} item{group.needs.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul style={{ margin: 0, padding: "6px 16px 6px 32px" }}>
                  {group.needs.map((need) => (
                    <li key={need.id} style={{ padding: "4px 0", fontSize: 13, wordBreak: "break-word" }}>
                      {need.item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasSubtasks && (
        <div className={detailStyles.section}>
          <div className={cardStyles.subHeaderRow}>
            <span className={detailStyles.sectionHeader}>Subtasks</span>
            <span className={cardStyles.cardMeta}>
              {doneCount} / {assignment.subtasks.length} completed
            </span>
          </div>
          <div className={cardStyles.subList}>
            {assignment.subtasks.map((child) => (
              <DetailSubtaskAccordion
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
        variant="row"
      />
    </div>
  );
}

// Same collapsed-row-expands-into-the-full-card pattern as
// StaffAssignmentCard's own StaffSubtaskAccordion, just expanding into this
// page's roomier StaffAssignmentDetail instead — kept as a separate copy so
// the two presentations stay fully independent.
function DetailSubtaskAccordion({
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
        <StaffAssignmentDetail
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
          <span className={cardStyles.subAccordionChevron} aria-hidden>
            ▸
          </span>
        </button>
      </div>
      {toggleError && <p className={styles.error}>{toggleError}</p>}
    </div>
  );
}
