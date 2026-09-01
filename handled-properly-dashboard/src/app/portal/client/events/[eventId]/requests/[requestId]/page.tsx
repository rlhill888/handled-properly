import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import RequestUploadForm from "./RequestUploadForm";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientRequestDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; requestId: string }>;
}) {
  const { eventId, requestId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_requests) scopes this — no row means either the
  // request doesn't exist or it isn't on one of this client's events.
  const { data: request } = await supabase
    .from("requests")
    .select("id, title, description, due_date, requires_file, fulfilled_at, file_path")
    .eq("id", requestId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!request) notFound();

  let fileUrl: string | null = null;
  if (request.file_path) {
    const { data } = await createAdminClient()
      .storage.from("request-attachments")
      .createSignedUrl(request.file_path, 60 * 10);
    fileUrl = data?.signedUrl ?? null;
  }

  const showUploadForm = request.requires_file && !request.fulfilled_at;

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
          <span className={styles.eyebrow}>Client · Request</span>
          <h1 className={styles.title}>{request.title}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={request.fulfilled_at ? styles.badge : styles.badgeMuted}>
              {request.fulfilled_at ? "Fulfilled" : "Outstanding"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
          <tbody>
            {request.description && (
              <tr>
                <td>Description</td>
                <td>{request.description}</td>
              </tr>
            )}
            <tr>
              <td>Due</td>
              <td>{request.due_date ? new Date(request.due_date).toLocaleDateString() : "—"}</td>
            </tr>
            {request.fulfilled_at && (
              <tr>
                <td>Fulfilled</td>
                <td>{new Date(request.fulfilled_at).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {request.requires_file && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>File</h2>
          {fileUrl && (
            <p>
              <a href={fileUrl} target="_blank" rel="noreferrer" className={styles.link}>
                View uploaded file
              </a>
            </p>
          )}
          {showUploadForm && <RequestUploadForm requestId={request.id} />}
        </div>
      )}
    </div>
  );
}
