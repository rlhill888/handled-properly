"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateAssignment, updateAssignmentStatus, deleteAssignment, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import NewAssignmentForm, { type StaffOption } from "./NewAssignmentForm";
import FormsPanel, { type ScopedForm } from "@/components/portal/FormsPanel";
import CommentsSection from "@/components/portal/CommentsSection";
import MultiSelectField from "@/components/portal/MultiSelectField";
import LockIcon from "@/components/portal/LockIcon";
import type { CommentData } from "@/lib/actions/assignment-comments";
import type { DependencyRef } from "@/lib/data/assignment-dependencies";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

export type AssignmentData = {
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
  forms: ScopedForm[];
  comments: CommentData[];
  dependsOn: DependencyRef[];
  blocks: DependencyRef[];
  subtasks: AssignmentData[];
};

export default function AssignmentCard({
  eventId,
  assignment,
  rosterStaff,
  existingAssignments,
  isLocked,
  availableForms,
  siteUrl,
  allowSubtasks = true,
  isSubtask = false,
}: {
  eventId: string;
  assignment: AssignmentData;
  rosterStaff: StaffOption[];
  existingAssignments: { id: string; title: string }[];
  isLocked: boolean;
  availableForms: { id: string; name: string }[];
  siteUrl: string;
  // A Subtask cannot itself have Subtasks (enforced server-side by the
  // assignments_no_nested_subtasks trigger) — false on the recursive
  // self-render below so a Subtask's own card never offers "+ Add Subtask".
  allowSubtasks?: boolean;
  // Only Subtasks get the quick complete-checkbox in the header — a
  // top-level Assignment's status is a bigger decision (affects the board
  // column it lives in) made via the Status field in the edit form instead.
  isSubtask?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
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

  // A plain checkbox toggle, distinct from the Status dropdown in the edit
  // form — this only ever moves between "done" and "ready" (unchecking a
  // completed item resets it to Ready to Work, not back to whatever
  // in-progress/blocked state it might have had before). Uses the same
  // updateAssignmentStatus the drag-and-drop board already calls, so it's
  // unaffected by the dependency gate the same way admin drags already are.
  const handleToggleComplete = () => {
    const nextStatus = assignment.status === "done" ? "ready" : "done";
    setCompleteError(null);
    startToggleComplete(async () => {
      const result = await updateAssignmentStatus(eventId, assignment.id, nextStatus);
      if (result?.error) setCompleteError(result.error);
    });
  };

  const doneCount = assignment.subtasks.filter((c) => c.status === "done").length;
  const hasSubtasks = assignment.subtasks.length > 0;

  const formsSection = (
    <div className={cardStyles.subSection}>
      <span className={cardStyles.subToggle}>Forms</span>
      <FormsPanel
        targetType="assignment"
        targetId={assignment.id}
        basePath={`/portal/admin/event-tracker/${eventId}/assignments`}
        availableForms={availableForms}
        forms={assignment.forms}
        siteUrl={siteUrl}
      />
    </div>
  );

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
                  isLocked={isLocked}
                  availableForms={availableForms}
                  siteUrl={siteUrl}
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

  const commentsSection = (
    <CommentsSection assignmentId={assignment.id} initialComments={assignment.comments} />
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
          <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
            {assignment.priority}
          </span>
        </div>
        {completeError && <p className={styles.error}>{completeError}</p>}
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

        <div className={cardStyles.assigneesBlock}>
          <span className={cardStyles.metaLabel}>Assigned to</span>
          {assignment.assigneeNames.length > 0 ? (
            <div className={styles.metaRow}>
              {assignment.assigneeNames.map((name) => (
                <span key={name} className={styles.badgeMuted}>
                  {name}
                </span>
              ))}
            </div>
          ) : (
            <span className={cardStyles.cardMeta}>No one yet</span>
          )}
        </div>

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
        {formsSection}
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

        <div className={styles.field}>
          <label className={styles.label}>Tags</label>
          <input name="tags" defaultValue={assignment.tags.join(", ")} className={styles.input} />
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
            <label className={styles.label}>Priority</label>
            <select name="priority" defaultValue={assignment.priority} className={styles.select}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Status</label>
            <select name="status" defaultValue={assignment.status} className={styles.select}>
              <option value="ready">Ready to Work</option>
              <option value="in_progress">In Progress</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.label}>Pickup</span>
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

        {rosterStaff.length > 0 && (
          <MultiSelectField
            name="assignee_ids"
            label="Assignees"
            options={rosterStaff.map((staff) => ({ id: staff.id, label: staff.name }))}
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

        <div className={styles.actions}>
          <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
          <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
      {dependenciesDisplay}
      {formsSection}
      {subtasksSection}
      {commentsSection}
    </div>
  );
}

// A collapsed row for one Subtask (checkbox + title + priority), expanding
// in place into its full AssignmentCard — as opposed to the old design
// where the whole Subtasks section collapsed/expanded together as one unit.
function SubtaskAccordion({
  eventId,
  assignment,
  rosterStaff,
  existingAssignments,
  isLocked,
  availableForms,
  siteUrl,
}: {
  eventId: string;
  assignment: AssignmentData;
  rosterStaff: StaffOption[];
  existingAssignments: { id: string; title: string }[];
  isLocked: boolean;
  availableForms: { id: string; name: string }[];
  siteUrl: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isToggling, startToggle] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleToggleComplete = () => {
    const nextStatus = assignment.status === "done" ? "ready" : "done";
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
          isLocked={isLocked}
          availableForms={availableForms}
          siteUrl={siteUrl}
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
        <span className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}>
          {assignment.priority}
        </span>
        <span className={cardStyles.subAccordionChevron} aria-hidden>
          ▸
        </span>
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
