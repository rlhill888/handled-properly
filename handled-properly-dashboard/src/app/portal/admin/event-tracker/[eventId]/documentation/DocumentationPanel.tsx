import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AddModalButton from "@/components/portal/AddModalButton";
import NewDocumentationForm from "./NewDocumentationForm";
import DocumentationPanelClient, { type DocumentationRowData } from "./DocumentationPanelClient";
import styles from "@/styles/admin-shared.module.css";

export default async function DocumentationPanel({
  eventId,
  isLocked,
}: {
  eventId: string;
  isLocked: boolean;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from("documentation")
    .select("id, title, description, file_path")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const adminClient = createAdminClient();
  const docs: DocumentationRowData[] = await Promise.all(
    (rows ?? []).map(async (row) => {
      const { data } = await adminClient.storage
        .from("documentation-files")
        .createSignedUrl(row.file_path, 60 * 60);
      return {
        id: row.id,
        title: row.title,
        description: row.description,
        fileUrl: data?.signedUrl ?? null,
      };
    })
  );

  return (
    <div className={styles.card}>
      <div className={styles.cardHeaderRow}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          Documentation
        </h2>
        {!isLocked && (
          <AddModalButton label="Upload Documentation" modalTitle="Upload Documentation">
            <NewDocumentationForm eventId={eventId} />
          </AddModalButton>
        )}
      </div>

      <DocumentationPanelClient eventId={eventId} docs={docs} />
    </div>
  );
}
