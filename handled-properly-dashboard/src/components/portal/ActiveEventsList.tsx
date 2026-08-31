import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventHeaderImageUrl } from "@/lib/data/event-header-image";
import styles from "@/styles/admin-shared.module.css";

export default async function ActiveEventsList() {
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, location, status, header_image_path, client:clients(company_name,contacts(name))"
    )
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    return <p className={styles.error}>Could not load events: {error.message}</p>;
  }

  if (!events || events.length === 0) {
    return <p className={styles.emptyState}>No active events yet.</p>;
  }

  const headerImageUrls = await Promise.all(
    events.map((event) => getEventHeaderImageUrl(event.header_image_path))
  );

  return (
    <div className={styles.eventCardGrid}>
      {events.map((event, i) => (
        <Link key={event.id} href={`/portal/admin/event-tracker/${event.id}`} className={styles.eventCard}>
          {headerImageUrls[i] ? (
            <img src={headerImageUrls[i]!} alt="" className={styles.eventCardImage} />
          ) : (
            <div className={styles.eventCardImagePlaceholder}>No header image</div>
          )}
          <div className={styles.eventCardBody}>
            <span className={styles.eventCardTitle}>{event.name}</span>
            <span className={styles.eventCardMeta}>
              {event.client?.company_name || event.client?.contacts?.name || "—"}
            </span>
            <span className={styles.eventCardMeta}>
              {event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}
            </span>
            <span className={styles.eventCardMeta}>{event.location || "—"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
