import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

// RLS (staff_select_visible_forms -> can_staff_view_form) only ever returns
// rows this staff member is entitled to see: staff_visible Forms on an
// Event they're rostered on. No app-level filtering needed.
async function getVisibleEventForms(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string
) {
  const { data } = await supabase
    .from("forms")
    .select("id, name")
    .eq("target_type", "event")
    .eq("target_id", eventId);

  return (data ?? []).map((f) => ({ id: f.id, name: f.name }));
}

export default async function StaffEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS restricts this to events the signed-in staff member is rostered
  // on — a direct link to any other event's id simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, location, status, completed_at, client:clients(company_name,contacts(name)), series:event_series(label)"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";
  const visibleForms = await getVisibleEventForms(supabase, event.id);

  return (
    <div className={styles.page}>
      <Link href="/portal/staff/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
            {event.series && <span className={styles.pill}>Series: {event.series.label}</span>}
          </div>
        </div>
        <div className={styles.actions}>
          <Link
            href={`/portal/staff/events/${event.id}/assignments`}
            className={styles.secondaryButton}
          >
            View Assignments
          </Link>
          <Link
            href={`/portal/staff/events/${event.id}/conversations`}
            className={styles.secondaryButton}
          >
            View Conversations
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
          <tbody>
            <tr>
              <td>Client</td>
              <td>{clientName}</td>
            </tr>
            <tr>
              <td>Date &amp; time</td>
              <td>{event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}</td>
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

      {visibleForms.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Forms</h2>
          <div className={styles.metaRow}>
            {visibleForms.map((form) => (
              <Link
                key={form.id}
                href={`/portal/staff/form-results/${form.id}`}
                className={styles.pill}
              >
                {form.name} — View results
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
