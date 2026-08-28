import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function ActiveEventsList() {
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, starts_at, location, status, client:clients(company_name,contacts(name))")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className={styles.error}>Could not load events: {error.message}</p>;
  }

  if (!events || events.length === 0) {
    return <p className={styles.emptyState}>No active events yet.</p>;
  }

  return (
    <table className={`${styles.table} ${styles.cardRows}`}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Client</th>
          <th>Date</th>
          <th>Location</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {events.map((event) => (
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
            <td data-label="Location">{event.location || "—"}</td>
            <td className={styles.cardActionCell}>
              <Link href={`/portal/admin/event-tracker/${event.id}`} className={styles.link}>
                View
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
