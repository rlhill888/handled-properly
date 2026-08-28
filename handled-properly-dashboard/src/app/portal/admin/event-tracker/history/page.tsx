import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function EventHistoryPage() {
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, starts_at, completed_at, client:clients(company_name,contacts(name))")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin</span>
          <h1 className={styles.title}>Event History</h1>
          <p className={styles.description}>Completed events, locked as a record of what happened.</p>
        </div>
        <Link href="/portal/admin/event-tracker" className={styles.backLink} aria-label="Back to Active Events">
          ←
        </Link>
      </div>

      {error && <p className={styles.error}>Could not load history: {error.message}</p>}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Completed Events ({events?.length ?? 0})</h2>
        {!events || events.length === 0 ? (
          <p className={styles.emptyState}>No completed events yet.</p>
        ) : (
          <table className={`${styles.table} ${styles.cardRows}`}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Client</th>
                <th>Completed</th>
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
                  <td data-label="Completed">
                    {event.completed_at ? new Date(event.completed_at).toLocaleString() : "—"}
                  </td>
                  <td className={styles.cardActionCell}>
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
