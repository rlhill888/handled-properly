import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import EventTaskUpdatesList from "./EventTaskUpdatesList";
import styles from "@/styles/admin-shared.module.css";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export default async function ClientEventTaskDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; taskId: string }>;
}) {
  const { eventId, taskId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_event_tasks) scopes this — no row means either
  // the task doesn't exist or it isn't on one of this client's events.
  const { data: task } = await supabase
    .from("event_tasks")
    .select("id, title, description, status")
    .eq("id", taskId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!task) notFound();

  const { data: updateRows } = await supabase
    .from("event_task_updates")
    .select("id, body, created_at")
    .eq("event_task_id", taskId)
    .order("created_at", { ascending: true });

  const updates = (updateRows ?? []).map((u) => ({ id: u.id, body: u.body, createdAt: u.created_at }));

  // RLS (client_select_own_request_dependencies) scopes this to this
  // client's own event tasks — shows which Requests are still blocking this
  // one from moving forward.
  const { data: dependencyRows } = await supabase
    .from("request_dependencies")
    .select("requests(id, title, fulfilled_at)")
    .eq("event_task_id", taskId);

  const blockingRequests = (dependencyRows ?? [])
    .map((row) => row.requests)
    .filter((r): r is { id: string; title: string; fulfilled_at: string | null } => r !== null)
    .filter((r) => r.fulfilled_at === null);

  return (
    <div className={styles.page}>
      <Link
        href={`/portal/client/events/${eventId}`}
        className={styles.backLink}
        aria-label="Back to Event"
      >
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Client · Event Task</span>
          <h1 className={styles.title}>{task.title}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={task.status === "done" ? styles.badge : styles.badgeMuted}>
              {STATUS_LABEL[task.status] ?? task.status}
            </span>
          </div>
        </div>
      </div>

      {task.description && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Description</h2>
          <p>{task.description}</p>
        </div>
      )}

      {blockingRequests.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Blocked On</h2>
          <div className={styles.metaRow}>
            {blockingRequests.map((r) => (
              <Link
                key={r.id}
                href={`/portal/client/events/${eventId}/requests/${r.id}`}
                className={styles.pill}
              >
                {r.title} — not yet fulfilled
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Updates</h2>
        <EventTaskUpdatesList updates={updates} />
      </div>
    </div>
  );
}
