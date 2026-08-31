"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { staffSetStatus } from "./actions";
import StaffAssignmentCard, { type StaffAssignmentData } from "./StaffAssignmentCard";
import Modal from "@/components/portal/Modal";
import LockIcon from "@/components/portal/LockIcon";
import boardStyles from "@/styles/assignments-board.module.css";

// Mirrors AssignmentBoardClient.tsx's admin board exactly — same dependency
// gate for "blocked," same pointer-driven drag mechanics. The one staff-only
// difference: only assignments actually assigned to the viewer can be
// dragged (they see every assignment on the event for context, per the
// page's own copy, but dragging someone else's work would be surprising).
function isBlocked(assignment: StaffAssignmentData): boolean {
  return assignment.dependsOn.some((dep) => dep.status !== "done");
}

const COLUMNS: { status: StaffAssignmentData["status"]; label: string }[] = [
  { status: "ready", label: "Ready to Work" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

const DRAG_THRESHOLD_PX = 8;

export default function StaffAssignmentBoardClient({
  eventId,
  assignments,
  currentStaffId,
  isLocked,
}: {
  eventId: string;
  assignments: StaffAssignmentData[];
  currentStaffId: string | null;
  isLocked: boolean;
}) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<StaffAssignmentData["status"] | null>(null);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [optimisticAssignments, setOptimisticStatus] = useOptimistic(
    assignments,
    (state, update: { id: string; status: StaffAssignmentData["status"] }) =>
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
  const isModalOpen = openAssignmentId !== null && openAssignment !== null;

  const isMine = useCallback(
    (assignment: StaffAssignmentData) =>
      Boolean(currentStaffId && assignment.assigneeIds.includes(currentStaffId)),
    [currentStaffId]
  );
  const isDraggable = useCallback(
    (assignment: StaffAssignmentData) => !isLocked && !isBlocked(assignment) && isMine(assignment),
    [isLocked, isMine]
  );

  const statusAtPoint = useCallback((x: number, y: number): StaffAssignmentData["status"] | null => {
    for (const [status, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return status as StaffAssignmentData["status"];
      }
    }
    return null;
  }, []);

  const commitDrop = (id: string, status: StaffAssignmentData["status"]) => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment || assignment.status === status) return;
    startTransition(async () => {
      setOptimisticStatus({ id, status });
      const result = await staffSetStatus(eventId, id, status);
      if (result?.error) alert(result.error);
      router.refresh();
    });
  };

  const handlePointerDown = (assignmentId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    const assignment = optimisticAssignments.find((a) => a.id === assignmentId);
    if (!assignment || !isDraggable(assignment)) return;
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
                  } ${isBlocked(assignment) ? boardStyles.titleCardBlocked : ""} ${
                    !isDraggable(assignment) ? boardStyles.titleCardStatic : ""
                  } ${isMine(assignment) ? boardStyles.titleCardMine : ""}`}
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
          <StaffAssignmentCard
            eventId={eventId}
            assignment={openAssignment}
            currentStaffId={currentStaffId}
            isLocked={isLocked}
          />
        )}
      </Modal>
    </>
  );
}
