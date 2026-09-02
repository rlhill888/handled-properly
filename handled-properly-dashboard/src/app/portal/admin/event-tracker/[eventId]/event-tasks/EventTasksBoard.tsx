import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import AddModalButton from "@/components/portal/AddModalButton";
import NewEventTaskForm from "./NewEventTaskForm";
import EventTasksBoardClient, { type EventTaskData } from "./EventTasksBoardClient";
import styles from "@/styles/admin-shared.module.css";

export default async function EventTasksBoard({
  eventId,
  isLocked,
}: {
  eventId: string;
  isLocked: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const [{ data: taskRows }, { data: requestRows }, { data: dependencyRows }, { data: assignmentRows }, { data: taskAssignmentRows }] =
    await Promise.all([
      supabase
        .from("event_tasks")
        .select("id, title, description, status, event_task_updates(id, body, created_at)")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      supabase
        .from("requests")
        .select("id, title, fulfilled_at")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      supabase.from("request_dependencies").select("event_task_id, request_id"),
      supabase
        .from("assignments")
        .select("id, title, status")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      supabase.from("event_task_assignments").select("event_task_id, assignment_id"),
    ]);

  const requestsById = new Map((requestRows ?? []).map((r) => [r.id, r]));
  const assignmentsById = new Map((assignmentRows ?? []).map((a) => [a.id, a]));

  const blockingByTask = new Map<string, string[]>();
  for (const dep of dependencyRows ?? []) {
    const list = blockingByTask.get(dep.event_task_id) ?? [];
    list.push(dep.request_id);
    blockingByTask.set(dep.event_task_id, list);
  }

  const assignmentsByTask = new Map<string, string[]>();
  for (const link of taskAssignmentRows ?? []) {
    const list = assignmentsByTask.get(link.event_task_id) ?? [];
    list.push(link.assignment_id);
    assignmentsByTask.set(link.event_task_id, list);
  }

  const tasks: EventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    updates: (row.event_task_updates ?? [])
      .map((u) => ({ id: u.id, body: u.body, createdAt: u.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    blockingRequests: (blockingByTask.get(row.id) ?? [])
      .map((requestId) => requestsById.get(requestId))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)
      .map((r) => ({ id: r.id, title: r.title, fulfilledAt: r.fulfilled_at })),
    linkedAssignments: (assignmentsByTask.get(row.id) ?? [])
      .map((assignmentId) => assignmentsById.get(assignmentId))
      .filter((a): a is NonNullable<typeof a> => a !== undefined)
      .map((a) => ({ id: a.id, title: a.title, status: a.status })),
  }));

  const requestOptions = (requestRows ?? []).map((r) => ({ id: r.id, label: r.title }));
  const assignmentOptions = (assignmentRows ?? []).map((a) => ({ id: a.id, label: a.title }));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeaderRow}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          Event Tasks
        </h2>
        {!isLocked && (
          <AddModalButton label="New Event Task" modalTitle="New Event Task">
            <NewEventTaskForm eventId={eventId} />
          </AddModalButton>
        )}
      </div>

      <EventTasksBoardClient
        eventId={eventId}
        tasks={tasks}
        requestOptions={requestOptions}
        assignmentOptions={assignmentOptions}
        isLocked={isLocked}
      />
    </div>
  );
}
