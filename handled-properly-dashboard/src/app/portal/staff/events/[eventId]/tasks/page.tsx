import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import StaffEventTaskBoard, { type StaffEventTaskData } from "../StaffEventTaskBoard";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffEventTasksPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (staff_select_rostered_events) scopes this — no row means either
  // the event doesn't exist or this staff member isn't on its roster.
  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  // RLS (staff_select_rostered_event_tasks) scopes this to Event Tasks on
  // an Event this staff member is rostered on — the same board the Client
  // sees, read-only.
  const { data: taskRows } = await supabase
    .from("event_tasks")
    .select("id, title, description, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const tasks: StaffEventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
  }));

  return (
    <div className={styles.page}>
      <Link href={`/portal/staff/events/${eventId}`} className={styles.backLink} aria-label={`Back to ${event.name}`}>
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Event Tasks</span>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.description}>
            The same Event Tasks the Client sees for this event, read-only — only the admin moves
            them.
          </p>
        </div>
      </div>

      <StaffEventTaskBoard eventId={eventId} tasks={tasks} />
    </div>
  );
}
