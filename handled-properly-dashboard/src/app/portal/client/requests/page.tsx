import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

type RequestRow = {
  id: string;
  event_id: string;
  title: string;
  due_date: string | null;
  fulfilled_at: string | null;
  events: { name: string } | null;
};

export default async function ClientActiveRequestsPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_requests) already scopes this to only this
  // client's own events — no extra filter needed here.
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, due_date, fulfilled_at, event_id, events(name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const activeRequests = (requests ?? []).filter((r) => !r.fulfilled_at);
  const pastRequests = (requests ?? [])
    .filter((r) => r.fulfilled_at)
    .sort((a, b) => new Date(b.fulfilled_at!).getTime() - new Date(a.fulfilled_at!).getTime());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Client</span>
          <h1 className={styles.title}>Requests</h1>
          <p className={styles.description}>Requests across all of your events.</p>
        </div>
      </div>

      <h2 className={styles.cardTitle}>Active ({activeRequests.length})</h2>
      {activeRequests.length === 0 ? (
        <p className={styles.emptyState}>No active requests right now.</p>
      ) : (
        <RequestsTable requests={activeRequests} showFulfilled={false} />
      )}

      <h2 className={styles.cardTitle}>Past ({pastRequests.length})</h2>
      {pastRequests.length === 0 ? (
        <p className={styles.emptyState}>No past completed requests yet</p>
      ) : (
        <RequestsTable requests={pastRequests} showFulfilled />
      )}
    </div>
  );
}

function RequestsTable({ requests, showFulfilled }: { requests: RequestRow[]; showFulfilled: boolean }) {
  return (
    <table className={`${styles.table} ${styles.cardRows}`}>
      <thead>
        <tr>
          <th>Title</th>
          <th>Event</th>
          {showFulfilled ? <th>Fulfilled</th> : <th>Due</th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((request) => (
          <tr key={request.id}>
            <td data-label="Title" className={styles.cardPrimaryCell}>
              <Link
                href={`/portal/client/events/${request.event_id}/requests/${request.id}`}
                className={styles.link}
              >
                {request.title}
              </Link>
            </td>
            <td data-label="Event">{request.events?.name ?? "—"}</td>
            {showFulfilled ? (
              <td data-label="Fulfilled">{new Date(request.fulfilled_at!).toLocaleDateString()}</td>
            ) : (
              <td data-label="Due">{request.due_date ? new Date(request.due_date).toLocaleDateString() : "—"}</td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
