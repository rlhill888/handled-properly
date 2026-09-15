"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAssignment, updateAssignmentStatus, deleteAssignment, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import NewAssignmentForm, { type StaffOption } from "./NewAssignmentForm";
import CommentsSection from "@/components/portal/CommentsSection";
import MultiSelectField from "@/components/portal/MultiSelectField";
import SingleSelectField from "@/components/portal/SingleSelectField";
import SelectDropdown from "@/components/portal/SelectDropdown";
import LockIcon from "@/components/portal/LockIcon";
import CalendarIcon from "@/components/portal/CalendarIcon";
import TargetIcon from "@/components/portal/TargetIcon";
import PeopleIcon from "@/components/portal/PeopleIcon";
import PersonIcon from "@/components/portal/PersonIcon";
import ClipboardIcon from "@/components/portal/ClipboardIcon";
import PackageIcon from "@/components/portal/PackageIcon";
import { addAssignmentComment, type CommentData } from "@/lib/actions/assignment-comments";
import type { DependencyRef } from "@/lib/data/assignment-dependencies";
import { getInitials } from "@/lib/get-initials";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

export type AssignmentData = {
  id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "blocked" | "done";
  dueDate: string | null;
  pickupSetting: "admin_only" | "open_pickup";
  assigneeIds: string[];
  assigneeNames: string[];
  comments: CommentData[];
  dependsOn: DependencyRef[];
  blocks: DependencyRef[];
  subtasks: AssignmentData[];
  eventTaskId: string | null;
  // Vendor Needs (items a vendor requested for the event) linked to this
  // Assignment from the Vendor Details card's "Vendor requests" modal — see
  // vendor_need_assignments.
  vendorNeeds: { id: string; item: string; vendorName: string }[];
};

const STATUS_OPTIONS: { value: AssignmentData["status"]; label: string }[] = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "blocked", label: "Blocked" },
  { value: "done", label: "Done" },
];

// Same palette StaffAssignmentCard uses for the same statuses, so status
// reads the same way for admins and staff.
const STATUS_DOT_COLORS: Record<AssignmentData["status"], string> = {
  not_started: "#6b7280",
  in_progress: "#92400e",
  blocked: "#b91c1c",
  done: "#0a7c2f",
};

export default function AssignmentCard({
  eventId,
  assignment,
  rosterStaff,
  existingAssignments,
  eventTasks,
  isLocked,
  allowSubtasks = true,
  isSubtask = false,
}: {
  eventId: string;
  assignment: AssignmentData;
  rosterStaff: StaffOption[];
  existingAssignments: { id: string; title: string }[];
  eventTasks: { id: string; title: string }[];
  isLocked: boolean;
  // A Subtask cannot itself have Subtasks (enforced server-side by the
  // assignments_no_nested_subtasks trigger) — false on the recursive
  // self-render below so a Subtask's own card never offers "+ Add Subtask".
  allowSubtasks?: boolean;
  // Only Subtasks get the quick complete-checkbox in the header, in
  // addition to the same Status dropdown every card shows in its body.
  isSubtask?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  // Starts open rather than collapsed: this component remounts fresh each
  // time its modal opens (AssignmentBoardClient only renders it while
  // openAssignmentId is set), so defaulting to true means the vendor items
  // list is already expanded the moment an admin clicks into an assignment.
  const [vendorNeedsExpanded, setVendorNeedsExpanded] = useState(true);
  const boundUpdate = updateAssignment.bind(null, eventId, assignment.id);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundUpdate, null);
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && state === null) {
      setEditing(false);
      // revalidatePath alone doesn't reliably refresh this route's data on
      // this Next.js version (see AGENTS.md) — without this, dependency
      // changes (add/remove in the "Depends on" field) silently don't show
      // up until a full page reload, even though the write succeeded.
      router.refresh();
    }
    wasPending.current = isPending;
  }, [isPending, state, router]);

  const handleDelete = async () => {
    if (!confirm(`Delete "${assignment.title}"?`)) return;
    const result = await deleteAssignment(eventId, assignment.id);
    if (result?.error) alert(result.error);
  };

  const [isTogglingComplete, startToggleComplete] = useTransition();
  const [completeError, setCompleteError] = useState<string | null>(null);

  // Shared by the subtask header's quick checkbox and the Status dropdown
  // below — both just move the assignment to a new status via the same
  // updateAssignmentStatus the drag-and-drop board already calls. Unlike
  // the staff side, admin status changes aren't gated by unmet
  // dependencies — admins can already override that via the edit form's
  // Status field, so the dropdown stays just as permissive.
  const handleStatusChange = (nextStatus: AssignmentData["status"]) => {
    setCompleteError(null);
    startToggleComplete(async () => {
      const result = await updateAssignmentStatus(eventId, assignment.id, nextStatus);
      if (result?.error) setCompleteError(result.error);
    });
  };

  // A plain checkbox toggle, distinct from the fuller Status dropdown —
  // this only ever moves between "done" and "in_progress" (unchecking a
  // completed item resets it to In Progress, not back to whatever blocked
  // state it might have had before).
  const handleToggleComplete = () => {
    handleStatusChange(assignment.status === "done" ? "in_progress" : "done");
  };

  const doneCount = assignment.subtasks.filter((c) => c.status === "done").length;
  const hasSubtasks = assignment.subtasks.length > 0;

  const subtasksSection = (
    <>
      {allowSubtasks && (hasSubtasks || !isLocked) && (
        <div className={cardStyles.subSection}>
          {hasSubtasks && (
            <span className={cardStyles.subToggle}>
              Subtasks ({doneCount}/{assignment.subtasks.length} done)
            </span>
          )}
          {hasSubtasks && (
            <div className={cardStyles.subList}>
              {assignment.subtasks.map((child) => (
                <SubtaskAccordion
                  key={child.id}
                  eventId={eventId}
                  assignment={child}
                  rosterStaff={rosterStaff}
                  existingAssignments={existingAssignments}
                  eventTasks={eventTasks}
                  isLocked={isLocked}
                />
              ))}
            </div>
          )}
          {!isLocked && !addingSubtask && (
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setAddingSubtask(true)}
            >
              + Add Subtask
            </button>
          )}
          {!isLocked && addingSubtask && (
            <div className={cardStyles.subList}>
              <NewAssignmentForm
                eventId={eventId}
                rosterStaff={rosterStaff}
                existingAssignments={existingAssignments}
                eventTasks={eventTasks}
                parentAssignmentId={assignment.id}
                submitLabel="Add Subtask"
                onCreated={() => setAddingSubtask(false)}
              />
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setAddingSubtask(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  // Grouped by vendor, in first-seen order — matches the "Vendor requests"
  // modal's own "Selected items" card so an item's vendor reads the same way
  // in both places.
  const vendorNeedGroups: { vendorName: string; needs: AssignmentData["vendorNeeds"] }[] = [];
  for (const need of assignment.vendorNeeds) {
    const group = vendorNeedGroups.find((g) => g.vendorName === need.vendorName);
    if (group) group.needs.push(need);
    else vendorNeedGroups.push({ vendorName: need.vendorName, needs: [need] });
  }

  // Which requested items (and whose) this Assignment is meant to fulfill —
  // linked from the Vendor Details card's "Vendor requests" modal. A plain
  // collapsible row (styled like the Status/Assigned to/Due date rows above
  // it) rather than always-open like Subtasks: usually not what an admin
  // scanning the board needs to see, unlike an in-progress Subtask's own
  // status.
  const vendorNeedsSection = assignment.vendorNeeds.length > 0 && (
    <div>
      <button
        type="button"
        className={cardStyles.fieldRow}
        onClick={() => setVendorNeedsExpanded((e) => !e)}
        aria-expanded={vendorNeedsExpanded}
        style={{
          width: "100%",
          background: "none",
          border: "none",
          padding: 0,
          paddingTop: 12,
          marginTop: 8,
          borderTop: "1px solid var(--border)",
          cursor: "pointer",
          font: "inherit",
        }}
      >
        <span className={cardStyles.fieldRowLabel}>
          <PackageIcon size={14} />
          Vendor requested items
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className={styles.pill}>{assignment.vendorNeeds.length}</span>
          <span
            className={`${styles.accordionChevron} ${vendorNeedsExpanded ? styles.accordionChevronOpen : ""}`}
            aria-hidden="true"
          >
            ▾
          </span>
        </span>
      </button>
      {vendorNeedsExpanded && (
        <div className={styles.accordionItem} style={{ marginTop: 12 }}>
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
                  <li
                    key={need.id}
                    style={{
                      padding: "4px 0",
                      fontSize: 13,
                      wordBreak: "break-word",
                    }}
                  >
                    {need.item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const commentsSection = (
    <CommentsSection
      initialComments={assignment.comments}
      onPost={(body) => addAssignmentComment(assignment.id, body)}
    />
  );

  const dependenciesDisplay = (assignment.dependsOn.length > 0 || assignment.blocks.length > 0) && (
    <div className={cardStyles.subSection}>
      {assignment.dependsOn.length > 0 && (
        <div>
          <span className={styles.label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {assignment.dependsOn.some((dep) => dep.status !== "done") && (
              <span style={{ color: "#b91c1c", display: "inline-flex" }}>
                <LockIcon size={11} />
              </span>
            )}
            Waiting on
          </span>
          <div className={styles.metaRow} style={{ marginTop: 6 }}>
            {assignment.dependsOn.map((dep) => (
              <span
                key={dep.id}
                className={dep.status === "done" ? cardStyles.depDone : cardStyles.depPending}
              >
                {dep.title}
              </span>
            ))}
          </div>
        </div>
      )}
      {assignment.blocks.length > 0 && (
        <div>
          <span className={styles.label}>Blocking</span>
          <div className={styles.metaRow} style={{ marginTop: 6 }}>
            {assignment.blocks.map((b) => (
              <span key={b.id} className={cardStyles.depBlocking}>
                {b.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (!editing) {
    return (
      <div className={cardStyles.card}>
        <div className={cardStyles.cardHeader}>
          {isSubtask ? (
            <label className={cardStyles.completeToggle}>
              <input
                type="checkbox"
                checked={assignment.status === "done"}
                disabled={isLocked || isTogglingComplete}
                onChange={handleToggleComplete}
                aria-label={
                  assignment.status === "done"
                    ? `Mark "${assignment.title}" incomplete`
                    : `Mark "${assignment.title}" complete`
                }
              />
              <span
                className={`${cardStyles.cardTitle} ${
                  assignment.status === "done" ? cardStyles.cardTitleDone : ""
                }`}
              >
                {assignment.title}
              </span>
            </label>
          ) : (
            <span
              className={`${cardStyles.cardTitle} ${
                assignment.status === "done" ? cardStyles.cardTitleDone : ""
              }`}
            >
              {assignment.title}
            </span>
          )}
        </div>
        {completeError && <p className={styles.error}>{completeError}</p>}
        {assignment.description && <p className={cardStyles.cardDescription}>{assignment.description}</p>}

        <span className={cardStyles.cardMeta}>
          {assignment.pickupSetting === "open_pickup" ? "Open pickup" : "Assigned"}
        </span>

        <div className={cardStyles.fieldRow}>
          <span className={cardStyles.fieldRowLabel}>
            <TargetIcon size={14} />
            Status
          </span>
          <div className={cardStyles.fieldRowValue}>
            <SelectDropdown
              options={STATUS_OPTIONS.map((opt) => ({
                id: opt.value,
                label: opt.label,
                dotColor: STATUS_DOT_COLORS[opt.value],
              }))}
              value={assignment.status}
              onChange={(value) => handleStatusChange(value as AssignmentData["status"])}
              placeholder="Set status…"
              disabled={isLocked || isTogglingComplete}
            />
          </div>
        </div>

        <div className={cardStyles.fieldRow}>
          <span className={cardStyles.fieldRowLabel}>
            <PeopleIcon size={14} />
            Assigned to
          </span>
          <div className={cardStyles.fieldRowValue}>
            {assignment.assigneeNames.length > 0 ? (
              <div className={cardStyles.avatarRow}>
                {assignment.assigneeNames.map((name) => (
                  <span key={name} className={cardStyles.avatarChip}>
                    <span className={cardStyles.avatarCircle}>{getInitials(name)}</span>
                    <span className={cardStyles.avatarName}>{name}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className={cardStyles.cardMeta}>No one yet</span>
            )}
          </div>
        </div>

        {assignment.dueDate && (
          <div className={cardStyles.fieldRow}>
            <span className={cardStyles.fieldRowLabel}>
              <CalendarIcon size={14} />
              Due date
            </span>
            <div className={cardStyles.dueDateBox}>
              <CalendarIcon size={14} />
              {new Date(assignment.dueDate).toLocaleDateString()}
            </div>
          </div>
        )}

        {assignment.eventTaskId && (
          <div className={cardStyles.fieldRow}>
            <span className={cardStyles.fieldRowLabel}>
              <ClipboardIcon size={14} />
              Event Task
            </span>
            <div className={cardStyles.fieldRowValue}>
              <span className={styles.pill}>
                {eventTasks.find((t) => t.id === assignment.eventTaskId)?.title ?? "Unknown"}
              </span>
            </div>
          </div>
        )}

        {!isLocked && (
          <div className={cardStyles.cardActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditing(true)}>
              Edit
            </button>
            <button type="button" className={styles.dangerButton} onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
        {dependenciesDisplay}
        {vendorNeedsSection}
        {subtasksSection}
        {commentsSection}
      </div>
    );
  }

  return (
    <div className={cardStyles.card}>
      <form action={formAction} className={styles.form}>
        {state?.error && <p className={styles.error}>{state.error}</p>}

        <div className={styles.field}>
          <label className={styles.label}>Title</label>
          <input name="title" defaultValue={assignment.title} required className={styles.input} />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <textarea
            name="description"
            defaultValue={assignment.description ?? ""}
            className={styles.textarea}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Due date</label>
            <input
              name="due_date"
              type="date"
              defaultValue={assignment.dueDate ?? ""}
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select name="status" defaultValue={assignment.status} className={styles.select}>
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <span className={cardStyles.fieldRowLabel}>
            <PersonIcon size={13} />
            Pickup
          </span>
          <div className={styles.checkboxRowGroup}>
            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="radio"
                  name="pickup_setting"
                  value="admin_only"
                  defaultChecked={assignment.pickupSetting === "admin_only"}
                />{" "}
                Admin assigns
              </label>
            </div>
            <div className={styles.checkboxRow}>
              <label>
                <input
                  type="radio"
                  name="pickup_setting"
                  value="open_pickup"
                  defaultChecked={assignment.pickupSetting === "open_pickup"}
                />{" "}
                Any roster staff can pick up
              </label>
            </div>
          </div>
        </div>

        {rosterStaff.length > 0 && (
          <MultiSelectField
            name="assignee_ids"
            label="Assignees"
            icon={<PeopleIcon size={13} />}
            chipVariant="avatar"
            options={rosterStaff.map((staff) => ({
              id: staff.id,
              label: staff.name,
            }))}
            initialSelectedIds={assignment.assigneeIds}
            placeholder="Add an assignee…"
            searchPlaceholder="Search staff…"
          />
        )}

        {existingAssignments.filter((a) => a.id !== assignment.id).length > 0 && (
          <MultiSelectField
            name="depends_on_ids"
            label="Depends on"
            helperText="(must be Done before this can start)"
            options={existingAssignments
              .filter((a) => a.id !== assignment.id)
              .map((a) => ({ id: a.id, label: a.title }))}
            initialSelectedIds={assignment.dependsOn.map((dep) => dep.id)}
            placeholder="Add a dependency…"
            searchPlaceholder="Search assignments…"
          />
        )}

        {eventTasks.length > 0 && (
          <SingleSelectField
            name="event_task_id"
            label="Event Task"
            helperText="(optional)"
            options={eventTasks.map((task) => ({ id: task.id, label: task.title }))}
            initialSelectedId={assignment.eventTaskId ?? ""}
            placeholder="Associate with an event task…"
            searchPlaceholder="Search event tasks…"
          />
        )}

        <div className={styles.actions}>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
      {dependenciesDisplay}
      {vendorNeedsSection}
      {subtasksSection}
      {commentsSection}
    </div>
  );
}

// A collapsed row for one Subtask (checkbox + title), expanding
// in place into its full AssignmentCard — as opposed to the old design
// where the whole Subtasks section collapsed/expanded together as one unit.
function SubtaskAccordion({
  eventId,
  assignment,
  rosterStaff,
  existingAssignments,
  eventTasks,
  isLocked,
}: {
  eventId: string;
  assignment: AssignmentData;
  rosterStaff: StaffOption[];
  existingAssignments: { id: string; title: string }[];
  eventTasks: { id: string; title: string }[];
  isLocked: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isToggling, startToggle] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggleComplete = () => {
    const nextStatus = assignment.status === "done" ? "in_progress" : "done";
    setError(null);
    startToggle(async () => {
      const result = await updateAssignmentStatus(eventId, assignment.id, nextStatus);
      if (result?.error) setError(result.error);
    });
  };

  if (expanded) {
    return (
      <div>
        <button type="button" className={cardStyles.subToggle} onClick={() => setExpanded(false)}>
          ▾ Collapse
        </button>
        <AssignmentCard
          eventId={eventId}
          assignment={assignment}
          rosterStaff={rosterStaff}
          existingAssignments={existingAssignments}
          eventTasks={eventTasks}
          isLocked={isLocked}
          allowSubtasks={false}
          isSubtask
        />
      </div>
    );
  }

  return (
    <div className={cardStyles.subAccordionHeader}>
      <label className={cardStyles.completeToggle}>
        <input
          type="checkbox"
          checked={assignment.status === "done"}
          disabled={isLocked || isToggling}
          onChange={handleToggleComplete}
          aria-label={
            assignment.status === "done"
              ? `Mark "${assignment.title}" incomplete`
              : `Mark "${assignment.title}" complete`
          }
        />
      </label>
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
          {assignment.title}
        </span>
        <span className={cardStyles.subAccordionChevron} aria-hidden>
          ▸
        </span>
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
