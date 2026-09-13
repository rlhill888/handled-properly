import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import ClientEventDocumentationList from "@/components/portal/ClientEventDocumentationList";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientDocumentationPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS restricts this to events belonging to the signed-in client — a
  // direct link to any other client's event id simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  // RLS (client_select_event_documentation) already limits this to this
  // event's Documentation — no extra filter needed.
  const { data: docs } = await supabase
    .from("documentation")
    .select("id, title, description, file_path")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const adminClient = createAdminClient();
  // `download: true` has Supabase Storage set Content-Disposition: attachment
  // on the response, so the link actually saves the file instead of just
  // navigating to it (which for a PDF/image just opens it in the tab).
  const docUrls = await Promise.all(
    (docs ?? []).map((d) =>
      adminClient.storage.from("documentation-files").createSignedUrl(d.file_path, 60 * 60, { download: true })
    )
  );

  return (
    <div className={styles.page}>
      <Link href={`/portal/client/events/${eventId}`} className={styles.backLink} aria-label={`Back to ${event.name}`}>
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Documentation</span>
          <h1 className={styles.title}>{event.name}</h1>
        </div>
      </div>

      <p className={styles.description}>Files for this event.</p>
      <ClientEventDocumentationList
        docs={(docs ?? []).map((doc, i) => ({
          id: doc.id,
          title: doc.title,
          description: doc.description,
          downloadUrl: docUrls[i].data?.signedUrl ?? null,
        }))}
      />
    </div>
  );
}
