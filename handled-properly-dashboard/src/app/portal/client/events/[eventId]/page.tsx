import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import ClientEventTaskBoard from "@/components/portal/ClientEventTaskBoard";
import ClientEventRequestsList from "@/components/portal/ClientEventRequestsList";
import ClientEventDocumentationList from "@/components/portal/ClientEventDocumentationList";
import CollapsibleCard from "@/components/portal/CollapsibleCard";
import ModalButton from "@/components/portal/ModalButton";
import InfoIcon from "@/components/portal/InfoIcon";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientEventDetailPage({
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
    .select("id, name, starts_at, location, status, completed_at, header_image_path")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: tasks }, { data: requests }, { data: docs }] = await Promise.all([
    supabase
      .from("event_tasks")
      .select("id, title, description, status")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("requests")
      .select("id, title, due_date, fulfilled_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("documentation")
      .select("id, title, description, file_path")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  const adminClient = createAdminClient();
  const docUrls = await Promise.all(
    (docs ?? []).map((d) => adminClient.storage.from("documentation-files").createSignedUrl(d.file_path, 60 * 60))
  );

  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);

  return (
    <div className={styles.page}>
      <Link href="/portal/client/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Client · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Details
          </h2>
          <ModalButton
            label={<InfoIcon size={16} />}
            ariaLabel="More details"
            modalTitle="Details"
            className={styles.iconButton}
          >
            <div>
              <h3 className={styles.cardTitle}>Documentation</h3>
              <ClientEventDocumentationList
                docs={(docs ?? []).map((doc, i) => ({
                  id: doc.id,
                  title: doc.title,
                  description: doc.description,
                  downloadUrl: docUrls[i].data?.signedUrl ?? null,
                }))}
              />
            </div>
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
              <Link
                href={`/portal/client/events/${event.id}/vendors`}
                className={styles.primaryButton}
                style={{ width: "100%" }}
              >
                Vendors and Event Staff Contacts
              </Link>
            </div>
          </ModalButton>
        </div>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
          <tbody>
            <tr>
              <td>Date &amp; time</td>
              <td>{event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}</td>
            </tr>
            <tr>
              <td>Location</td>
              <td>{event.location || "—"}</td>
            </tr>
            {event.completed_at && (
              <tr>
                <td>Completed</td>
                <td>{new Date(event.completed_at).toLocaleString()}</td>
              </tr>
            )}
          </tbody>
        </table>

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <CollapsibleCard
            title="Requests"
            badgeCount={(requests ?? []).filter((r) => !r.fulfilled_at).length}
            defaultOpen={false}
            bare
          >
            <ClientEventRequestsList
              eventId={event.id}
              requests={(requests ?? []).map((r) => ({
                id: r.id,
                title: r.title,
                dueDate: r.due_date,
                fulfilledAt: r.fulfilled_at,
              }))}
            />
          </CollapsibleCard>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Event Tasks</h2>
        <ClientEventTaskBoard eventId={event.id} tasks={tasks ?? []} />
      </div>
    </div>
  );
}
