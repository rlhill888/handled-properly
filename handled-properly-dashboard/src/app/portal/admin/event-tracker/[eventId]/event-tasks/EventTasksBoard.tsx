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

  const [{ data: taskRows }, { data: requestRows }, { data: dependencyRows }] = await Promise.all([
    supabase
      .from("event_tasks")
      .select("id, title, description, status, event_task_updates(id, body, created_at)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase.from("requests").select("id, title").eq("event_id", eventId).order("created_at", { ascending: true }),
    supabase.from("request_dependencies").select("event_task_id, request_id"),
  ]);

  const blockingByTask = new Map<string, string[]>();
  for (const dep of dependencyRows ?? []) {
    const list = blockingByTask.get(dep.event_task_id) ?? [];
    list.push(dep.request_id);
    blockingByTask.set(dep.event_task_id, list);
  }

  const tasks: EventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    updates: (row.event_task_updates ?? [])
      .map((u) => ({ id: u.id, body: u.body, createdAt: u.created_at }))
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    blockingRequestIds: blockingByTask.get(row.id) ?? [],
  }));

  const requestOptions = (requestRows ?? []).map((r) => ({ id: r.id, label: r.title }));

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
        isLocked={isLocked}
      />
    </div>
  );
}
