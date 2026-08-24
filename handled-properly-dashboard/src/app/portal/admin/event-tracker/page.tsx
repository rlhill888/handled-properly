import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewEventForm from "./NewEventForm";
import styles from "@/styles/admin-shared.module.css";

export default async function EventTrackerPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: events, error }, { data: clients }, { data: series }] = await Promise.all([
    supabase
      .from("events")
      .select("id, name, starts_at, location, status, client:clients(company_name,contacts(name))")
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("id, company_name, contacts(name)"),
    supabase.from("event_series").select("id, label, client_id"),
  ]);

  const clientOptions = (clients ?? [])
    .filter((c) => c.contacts !== null)
    .map((c) => ({
      id: c.id,
      name: c.company_name || c.contacts!.name,
    }));

  const seriesOptions = (series ?? []).map((s) => ({
    id: s.id,
    label: s.label,
    clientId: s.client_id,
  }));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Event Tracker</h1>
          <p className={styles.description}>Active events. Completed events move to History.</p>
        </div>
        <Link href="/portal/admin/event-tracker/history" className={styles.secondaryButton}>
          View History
        </Link>
      </div>

      {error && <p className={styles.error}>Could not load events: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>New Event</h2>
        <NewEventForm clients={clientOptions} series={seriesOptions} />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Active Events ({events?.length ?? 0})</h2>
        {!events || events.length === 0 ? (
          <p className={styles.emptyState}>No active events yet.</p>
        ) : (
          <table className={styles.table}>
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
                  <td>{event.name}</td>
                  <td>{event.client?.company_name || event.client?.contacts?.name || "—"}</td>
                  <td>
                    {event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}
                  </td>
                  <td>{event.location || "—"}</td>
                  <td>
                    <Link href={`/portal/admin/event-tracker/${event.id}`} className={styles.link}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
