import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import { CHAT_ENABLED } from "@/lib/feature-flags";
import StaffAssignmentBoardClient from "./assignments/StaffAssignmentBoardClient";
import { getStaffAssignments } from "./assignments/data";
import StaffEventTaskBoard, { type StaffEventTaskData } from "./StaffEventTaskBoard";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();
  const actor = await getCurrentActor();
  const currentStaffId = actor?.role === "event_staff" ? actor.eventStaffId : null;

  // RLS restricts this to events the signed-in staff member is rostered
  // on — a direct link to any other event's id simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, ends_at, location, status, completed_at, header_image_path, client:clients(company_name,contacts(name))"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";
  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);
  const isLocked = event.status === "completed";

  const assignments = await getStaffAssignments(eventId);

  // The same Event Tasks the Client sees for this event, read-only — only
  // the admin moves them.
  const { data: taskRows } = await supabase
    .from("event_tasks")
    .select("id, title, description, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const taskIds = (taskRows ?? []).map((row) => row.id);

  // Fetched up front (rather than on demand) so the task board's modal can
  // show full details instantly, the same way the Assignments board above
  // already prefetches everything for its own modal.
  const { data: updateRows } = await supabase
    .from("event_task_updates")
    .select("id, event_task_id, body, created_at")
    .in("event_task_id", taskIds)
    .order("created_at", { ascending: true });

  const updatesByTask = new Map<string, StaffEventTaskData["updates"]>();
  for (const row of updateRows ?? []) {
    const list = updatesByTask.get(row.event_task_id) ?? [];
    list.push({ id: row.id, body: row.body, createdAt: row.created_at });
    updatesByTask.set(row.event_task_id, list);
  }

  // RLS (staff_select_rostered_event_task_assignments) scopes this to this
  // event's own tasks — shows the staff-side work behind each Event Task.
  const { data: linkRows } = await supabase
    .from("event_task_assignments")
    .select(
      "event_task_id, assignments(id, title, description, status, due_date, priority, assignment_assignees(event_staff(contacts(name))))"
    )
    .in("event_task_id", taskIds);

  const linkedAssignmentsByTask = new Map<string, StaffEventTaskData["linkedAssignments"]>();
  for (const row of linkRows ?? []) {
    if (!row.assignments) continue;
    const a = row.assignments;
    const list = linkedAssignmentsByTask.get(row.event_task_id) ?? [];
    list.push({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      dueDate: a.due_date,
      priority: a.priority,
      assigneeNames: (a.assignment_assignees ?? [])
        .map((aa) => aa.event_staff?.contacts?.name)
        .filter((name): name is string => Boolean(name)),
    });
    linkedAssignmentsByTask.set(row.event_task_id, list);
  }

  const tasks: StaffEventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    updates: updatesByTask.get(row.id) ?? [],
    linkedAssignments: linkedAssignmentsByTask.get(row.id) ?? [],
  }));

  return (
    <div className={styles.page}>
      <Link href="/portal/staff/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
        </div>
        {CHAT_ENABLED && (
          <div className={styles.actions}>
            <Link
              href={`/portal/staff/events/${event.id}/conversations`}
              className={styles.secondaryButton}
            >
              View Conversations
            </Link>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <p className={styles.description}>Basic info about this event.</p>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
          <tbody>
            <tr>
              <td>Client</td>
              <td>{clientName}</td>
            </tr>
            <tr>
              <td>Date &amp; time</td>
              <td>{formatEventDate(event.starts_at, event.ends_at)}</td>
            </tr>
            <tr>
              <td>Location</td>
              <td>{event.location || "—"}</td>
            </tr>
            {event.completed_at && (
              <tr>
                <td>Completed</td>
                <td>{new Date(event.completed_at).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Assignments</h2>
        <p className={styles.description}>
          All staff assignments for this event. Drag your own assignments between columns to
          update their status, or tap ▾ for full details.
        </p>
        <StaffAssignmentBoardClient
          eventId={eventId}
          assignments={assignments}
          currentStaffId={currentStaffId}
          isLocked={isLocked}
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Event Tasks</h2>
        <p className={styles.description}>
          Tasks for an event that the client sees (the client does not see staff assignments).
        </p>
        <StaffEventTaskBoard eventId={eventId} tasks={tasks} />
      </div>
    </div>
  );
}
