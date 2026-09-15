import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";
import RequestsTabs from "./RequestsTabs";

export default async function ClientActiveRequestsPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_requests) already scopes this to only this
  // client's own events — no extra filter needed here.
  const { data: requests } = await supabase
    .from("requests")
    .select("id, title, due_date, fulfilled_at, event_id, events(name)")
    .order("due_date", { ascending: true, nullsFirst: false });

  const activeRequests = (requests ?? []).filter((r) => !r.fulfilled_at);
  const completedRequests = (requests ?? [])
    .filter((r) => r.fulfilled_at)
    .sort((a, b) => new Date(b.fulfilled_at!).getTime() - new Date(a.fulfilled_at!).getTime());

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Requests</h1>
          <p className={styles.description}>Review and complete requests for your events.</p>
        </div>
      </div>

      <RequestsTabs activeRequests={activeRequests} completedRequests={completedRequests} />
    </div>
  );
}
