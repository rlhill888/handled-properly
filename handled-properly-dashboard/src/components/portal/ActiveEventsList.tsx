import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventHeaderImageUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import styles from "@/styles/admin-shared.module.css";

// Shared by the admin (Active Events on /portal/admin/event-tracker and the
// /portal root dashboard) and staff (/portal root dashboard) views — the
// query itself is role-agnostic; RLS (admin_all vs staff_select_rostered_events)
// is what actually scopes an event-staff session down to only their own
// rostered active events. Only the link destination differs per role.
export default async function ActiveEventsList({ linkBase }: { linkBase: string }) {
  const supabase = await createSupabaseServerClient();

  const { data: events, error } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, ends_at, location, status, header_image_path, client:clients(company_name,contacts(name))"
    )
    .eq("status", "active")
    .order("starts_at", { ascending: true, nullsFirst: false });

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
        <Link key={event.id} href={`${linkBase}/${event.id}`} className={styles.eventCard}>
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
              {formatEventDate(event.starts_at, event.ends_at)}
            </span>
            <span className={styles.eventCardMeta}>{event.location || "—"}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
