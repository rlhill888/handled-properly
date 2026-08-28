import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffEventsPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (staff_select_rostered_events) already scopes this to only events
  // this staff member is on the Roster for — no extra filter needed here.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, starts_at, location, status, client:clients(company_name,contacts(name))")
    .order("starts_at", { ascending: true, nullsFirst: false });

  const activeEvents = (events ?? []).filter((e) => e.status === "active");
  const completedEvents = (events ?? []).filter((e) => e.status === "completed");

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff</span>
          <h1 className={styles.title}>My Events</h1>
          <p className={styles.description}>Events you're currently on the roster for.</p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load events: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Active ({activeEvents.length})</h2>
        {activeEvents.length === 0 ? (
          <p className={styles.emptyState}>You're not on the roster for any active events yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {activeEvents.map((event) => (
                <tr key={event.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {event.name}
                  </td>
                  <td data-label="Client">
                    {event.client?.company_name || event.client?.contacts?.name || "—"}
                  </td>
                  <td data-label="Date">
                    {event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}
                  </td>
                  <td className={styles.cardActionCell}>
                    <Link href={`/portal/staff/events/${event.id}`} className={styles.link}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {completedEvents.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Completed ({completedEvents.length})</h2>
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {completedEvents.map((event) => (
                <tr key={event.id}>
                  <td data-label="Name" className={styles.cardPrimaryCell}>
                    {event.name}
                  </td>
                  <td data-label="Client">
                    {event.client?.company_name || event.client?.contacts?.name || "—"}
                  </td>
                  <td className={styles.cardActionCell}>
                    <Link href={`/portal/staff/events/${event.id}`} className={styles.link}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
