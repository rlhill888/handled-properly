import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCommentsByRequestIds } from "@/lib/data/request-comments";
import AddModalButton from "@/components/portal/AddModalButton";
import NewRequestForm from "./NewRequestForm";
import RequestsPanelClient, { type RequestRowData } from "./RequestsPanelClient";
import styles from "@/styles/admin-shared.module.css";

export default async function RequestsPanel({
  eventId,
  isLocked,
}: {
  eventId: string;
  isLocked: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("requests")
    .select("id, title, due_date, request_type, fulfillment_setting, fulfilled_at, file_path, response_text, checked_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const adminClient = createAdminClient();
  const commentsByRequest = await getCommentsByRequestIds(supabase, (rows ?? []).map((row) => row.id));
  const requests: RequestRowData[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      let fileUrl: string | null = null;
      if (row.file_path) {
        const { data } = await adminClient.storage
          .from("request-attachments")
          .createSignedUrl(row.file_path, 60 * 10);
        fileUrl = data?.signedUrl ?? null;
      }
      return {
        id: row.id,
        title: row.title,
        dueDate: row.due_date,
        requestType: row.request_type,
        fulfillmentSetting: row.fulfillment_setting,
        fulfilledAt: row.fulfilled_at,
        fileUrl,
        responseText: row.response_text,
        checkedAt: row.checked_at,
        comments: commentsByRequest.get(row.id) ?? [],
      };
    })
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeaderRow}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          Requests
        </h2>
        {!isLocked && (
          <AddModalButton label="New Request" modalTitle="New Request">
            <NewRequestForm eventId={eventId} />
          </AddModalButton>
        )}
      </div>

      <RequestsPanelClient eventId={eventId} requests={requests} />
    </div>
  );
}
