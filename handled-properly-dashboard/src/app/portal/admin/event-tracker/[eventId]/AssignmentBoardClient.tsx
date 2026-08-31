"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { updateAssignmentStatus } from "./assignments/actions";
import AssignmentCard, { type AssignmentData } from "./assignments/AssignmentCard";
import type { StaffOption } from "./assignments/NewAssignmentForm";
import Modal from "@/components/portal/Modal";
import LockIcon from "@/components/portal/LockIcon";
import boardStyles from "@/styles/assignments-board.module.css";

// An assignment with an unmet dependency can't move on the board at all —
// it still opens (via the ▾ toggle) for viewing/editing, just can't be
// dragged. Mirrors the dependency gate in the set_assignment_status RPC
// (which only covers the staff path); dragging is admin-only and writes
// status directly, so without this the board would let an admin drag a
// blocked assignment around with no indication anything was wrong.
function isBlocked(assignment: AssignmentData): boolean {
  return assignment.dependsOn.some((dep) => dep.status !== "done");
}

const COLUMNS: { status: AssignmentData["status"]; label: string }[] = [
  { status: "ready", label: "Ready to Work" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

// How far the pointer has to move before a press becomes a drag, so a
// simple tap doesn't get mistaken for a drag attempt.
const DRAG_THRESHOLD_PX = 8;

export default function AssignmentBoardClient({
  eventId,
  assignments,
  rosterStaff,
  existingAssignments,
  availableForms,
  siteUrl,
  isLocked,
}: {
  eventId: string;
  assignments: AssignmentData[];
  rosterStaff: StaffOption[];
  existingAssignments: { id: string; title: string }[];
  availableForms: { id: string; name: string }[];
  siteUrl: string;
  isLocked: boolean;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<AssignmentData["status"] | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const columnRefs = useRef(new Map<string, HTMLDivElement>());
  const pointerState = useRef<{
    assignmentId: string;
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  const openAssignment = assignments.find((a) => a.id === openAssignmentId) ?? null;
  // AssignmentCard (shown in the modal below) can delete an assignment from
  // right here — derived (not synced via an effect) so the modal closes
  // itself the moment its assignment no longer exists in `assignments`,
  // rather than leaving an empty dialog open after a delete.
  const isModalOpen = openAssignmentId !== null && openAssignment !== null;

  // Pointer Events fire uniformly for mouse, touch, and pen — unlike the
  // native HTML5 Drag and Drop API, which is mouse-only and never fires on
  // touch devices at all. Hit-testing columns manually (rather than relying
  // on dragover/drop) is what lets this same code drive both.
  const statusAtPoint = useCallback((x: number, y: number): AssignmentData["status"] | null => {
    for (const [status, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return status as AssignmentData["status"];
      }
    }
    return null;
  }, []);

  const commitDrop = (id: string, status: AssignmentData["status"]) => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment || assignment.status === status) return;
    startTransition(() => {
      updateAssignmentStatus(eventId, id, status);
    });
  };

  const handlePointerDown = (assignmentId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (assignment && isBlocked(assignment)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerState.current = {
      assignmentId,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      dragging: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    if (!state || state.pointerId !== e.pointerId) return;

    if (!state.dragging) {
      const dx = e.clientX - state.startX;
      const dy = e.clientY - state.startY;
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
      setDraggingId(state.assignmentId);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    setDragOverStatus(statusAtPoint(e.clientX, e.clientY));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const state = pointerState.current;
    pointerState.current = null;
    if (!state || state.pointerId !== e.pointerId) return;

    if (state.dragging) {
      const status = statusAtPoint(e.clientX, e.clientY);
      if (status) commitDrop(state.assignmentId, status);
    }
    setDraggingId(null);
    setDragOverStatus(null);
  };

  return (
    <>
      <div className={boardStyles.board}>
        {COLUMNS.map((column) => (
          <div
            key={column.status}
            ref={(el) => {
              if (el) columnRefs.current.set(column.status, el);
              else columnRefs.current.delete(column.status);
            }}
            className={`${boardStyles.column} ${
              dragOverStatus === column.status ? boardStyles.columnDragOver : ""
            }`}
          >
            <div className={boardStyles.columnHeader}>
              <span>{column.label}</span>
              <span>{assignments.filter((a) => a.status === column.status).length}</span>
            </div>

            {assignments
              .filter((a) => a.status === column.status)
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className={`${boardStyles.titleCard} ${
                    draggingId === assignment.id ? boardStyles.titleCardDragging : ""
                  } ${isBlocked(assignment) ? boardStyles.titleCardBlocked : ""}`}
                  onPointerDown={handlePointerDown(assignment.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <span className={boardStyles.titleCardText}>
                    {isBlocked(assignment) && (
                      <span className={boardStyles.titleCardBlockedIcon} aria-label="Blocked">
                        <LockIcon size={12} />
                      </span>
                    )}
                    {assignment.title}
                  </span>
                  <button
                    type="button"
                    className={boardStyles.titleCardToggle}
                    aria-label={`View details for ${assignment.title}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setOpenAssignmentId(assignment.id)}
                  >
                    ▾
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      <Modal open={isModalOpen} onClose={() => setOpenAssignmentId(null)} title="Assignment">
        {openAssignment && (
          <AssignmentCard
            eventId={eventId}
            assignment={openAssignment}
            rosterStaff={rosterStaff}
            existingAssignments={existingAssignments}
            isLocked={isLocked}
            availableForms={availableForms}
            siteUrl={siteUrl}
          />
        )}
      </Modal>
    </>
  );
}
