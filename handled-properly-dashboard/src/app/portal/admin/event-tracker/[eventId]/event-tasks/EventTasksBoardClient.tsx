"use client";

import { useCallback, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEventTaskStatus } from "./actions";
import EventTaskCard from "./EventTaskCard";
import Modal from "@/components/portal/Modal";
import LockIcon from "@/components/portal/LockIcon";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

export type EventTaskUpdateData = { id: string; body: string; createdAt: string };
export type BlockingRequest = { id: string; title: string; fulfilledAt: string | null };
export type LinkedAssignment = {
  id: string;
  title: string;
  status: "ready" | "in_progress" | "blocked" | "done";
};
export type EventTaskData = {
  id: string;
  title: string;
  description: string | null;
  status: "not_started" | "in_progress" | "blocked" | "done";
  updates: EventTaskUpdateData[];
  blockingRequests: BlockingRequest[];
  linkedAssignments: LinkedAssignment[];
};
export type RequestOption = { id: string; label: string };
export type AssignmentOption = { id: string; label: string };

// An Event Task with an unmet Request Dependency can't move on the board at
// all — mirrors isBlocked on the Assignments board (AssignmentBoardClient),
// which disables dragging entirely rather than only blocking the specific
// in_progress/done transitions the set_event_task_status RPC gates.
function isBlocked(task: EventTaskData): boolean {
  return task.blockingRequests.some((r) => !r.fulfilledAt);
}

const COLUMNS: { status: EventTaskData["status"]; label: string }[] = [
  { status: "not_started", label: "Not Started" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

// How far the pointer has to move before a press becomes a drag, so a
// simple tap doesn't get mistaken for a drag attempt.
const DRAG_THRESHOLD_PX = 8;

export default function EventTasksBoardClient({
  eventId,
  tasks,
  requestOptions,
  assignmentOptions,
  isLocked,
}: {
  eventId: string;
  tasks: EventTaskData[];
  requestOptions: RequestOption[];
  assignmentOptions: AssignmentOption[];
  isLocked: boolean;
}) {
  const router = useRouter();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<EventTaskData["status"] | null>(null);
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  // Drops need to show the card in its new column right away — the write +
  // revalidatePath/router.refresh() round trip is slow enough that without
  // this, the card visibly snaps back to its old column and then jumps to
  // the new one once the server data catches up.
  const [optimisticTasks, setOptimisticStatus] = useOptimistic(
    tasks,
    (state, update: { id: string; status: EventTaskData["status"] }) =>
      state.map((t) => (t.id === update.id ? { ...t, status: update.status } : t))
  );

  const columnRefs = useRef(new Map<string, HTMLDivElement>());
  const pointerState = useRef<{
    taskId: string;
    pointerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
  } | null>(null);

  const openTask = tasks.find((t) => t.id === openTaskId) ?? null;
  const isModalOpen = openTaskId !== null && openTask !== null;

  // Pointer Events fire uniformly for mouse, touch, and pen — hit-testing
  // columns manually is what lets this same code drive both, same as the
  // Assignments board.
  const statusAtPoint = useCallback((x: number, y: number): EventTaskData["status"] | null => {
    for (const [status, el] of columnRefs.current) {
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
        return status as EventTaskData["status"];
      }
    }
    return null;
  }, []);

  const commitDrop = (id: string, status: EventTaskData["status"]) => {
    const task = tasks.find((t) => t.id === id);
    if (!task || task.status === status) return;
    startTransition(async () => {
      setOptimisticStatus({ id, status });
      const result = await setEventTaskStatus(id, eventId, status);
      if (result?.error) alert(result.error);
      router.refresh();
    });
  };

  const handlePointerDown = (taskId: string) => (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) return;
    const task = optimisticTasks.find((t) => t.id === taskId);
    if (task && isBlocked(task)) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerState.current = {
      taskId,
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
      setDraggingId(state.taskId);
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
      if (status) commitDrop(state.taskId, status);
    }
    setDraggingId(null);
    setDragOffset(null);
    setDragOverStatus(null);
  };

  if (tasks.length === 0) {
    return <p className={styles.emptyState}>No event tasks yet.</p>;
  }

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
              <span>{optimisticTasks.filter((t) => t.status === column.status).length}</span>
            </div>

            {optimisticTasks
              .filter((t) => t.status === column.status)
              .map((task) => (
                <div
                  key={task.id}
                  className={`${boardStyles.titleCard} ${
                    draggingId === task.id ? boardStyles.titleCardDragging : ""
                  } ${isBlocked(task) ? boardStyles.titleCardBlocked : ""}`}
                  style={
                    draggingId === task.id && dragOffset
                      ? { transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)` }
                      : undefined
                  }
                  onPointerDown={handlePointerDown(task.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                >
                  <span className={boardStyles.titleCardText}>
                    {isBlocked(task) && (
                      <span className={boardStyles.titleCardBlockedIcon} aria-label="Blocked">
                        <LockIcon size={12} />
                      </span>
                    )}
                    {task.title}
                  </span>
                  <button
                    type="button"
                    className={boardStyles.titleCardToggle}
                    aria-label={`View details for ${task.title}`}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => setOpenTaskId(task.id)}
                  >
                    ▾
                  </button>
                </div>
              ))}
          </div>
        ))}
      </div>

      <Modal open={isModalOpen} onClose={() => setOpenTaskId(null)} title="Event Task">
        {openTask && (
          <EventTaskCard
            eventId={eventId}
            task={openTask}
            requestOptions={requestOptions}
            assignmentOptions={assignmentOptions}
            isLocked={isLocked}
          />
        )}
      </Modal>
    </>
  );
}
