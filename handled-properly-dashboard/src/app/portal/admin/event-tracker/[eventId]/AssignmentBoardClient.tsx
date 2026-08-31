"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<AssignmentData["status"] | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Drops need to show the card in its new column right away — the write +
  // revalidatePath/router.refresh() round trip is slow enough that without
  // this, the card visibly snaps back to its old column and then jumps to
  // the new one once the server data catches up. React automatically
  // reconciles this back to the real `assignments` prop once the transition
  // below (which stays pending through the router.refresh()) settles.
  const [optimisticAssignments, setOptimisticStatus] = useOptimistic(
    assignments,
    (state, update: { id: string; status: AssignmentData["status"] }) =>
      state.map((a) => (a.id === update.id ? { ...a, status: update.status } : a))
  );

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
    startTransition(async () => {
      setOptimisticStatus({ id, status });
      const result = await updateAssignmentStatus(eventId, id, status);
      if (result?.error) alert(result.error);
      // Keeps this transition (and so the optimistic status above) pending
      // until the refreshed server data actually lands, instead of reverting
      // to the stale pre-drop status the instant the write finishes.
      router.refresh();
    });
  };

  const handlePointerDown = (assignmentId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const assignment = optimisticAssignments.find((a) => a.id === assignmentId);
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

    const dx = e.clientX - state.startX;
    const dy = e.clientY - state.startY;

    if (!state.dragging) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
      state.dragging = true;
      setDraggingId(state.assignmentId);
      e.currentTarget.setPointerCapture(e.pointerId);
    }

    e.preventDefault();
    // Moves the card by the same amount the pointer has moved, so it tracks
    // the cursor/finger 1:1 (preserving the original grab offset) instead of
    // just changing opacity to hint that something is happening.
    setDragOffset({ x: dx, y: dy });
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
    setDragOffset(null);
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
              <span>{optimisticAssignments.filter((a) => a.status === column.status).length}</span>
            </div>

            {optimisticAssignments
              .filter((a) => a.status === column.status)
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className={`${boardStyles.titleCard} ${
                    draggingId === assignment.id ? boardStyles.titleCardDragging : ""
                  } ${isBlocked(assignment) ? boardStyles.titleCardBlocked : ""}`}
                  style={
                    draggingId === assignment.id && dragOffset
                      ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }
                      : undefined
                  }
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
