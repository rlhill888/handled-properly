import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventHeaderImageUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import styles from "@/styles/admin-shared.module.css";

export default async function VendorEventsPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (vendor_select_own_events, via is_vendor_for_event) already scopes
  // this to only events this vendor is on the Vendor List for, and only
  // while their access hasn't auto-expired — no extra filter needed here.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, location, status, header_image_path")
    .order("starts_at", { ascending: true, nullsFirst: false });

  const headerImageUrls = await Promise.all(
    (events ?? []).map((event) => getEventHeaderImageUrl(event.header_image_path))
  );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Vendor</span>
          <h1 className={styles.title}>Your Events</h1>
          <p className={styles.description}>
            Events you&apos;ve been added to. Open one to see arrival, setup, and parking details.
          </p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load events: {error.message}</p>}

      {!events || events.length === 0 ? (
        <p className={styles.emptyState}>You don&apos;t have access to any events right now.</p>
      ) : (
        <div className={styles.eventCardGrid}>
          {events.map((event, i) => (
            <Link key={event.id} href={`/portal/vendor/events/${event.id}`} className={styles.eventCard}>
              {headerImageUrls[i] ? (
                <img src={headerImageUrls[i]!} alt="" className={styles.eventCardImage} />
              ) : (
                <div className={styles.eventCardImagePlaceholder}>No header image</div>
              )}
              <div className={styles.eventCardBody}>
                <span className={styles.eventCardTitle}>{event.name}</span>
                <span className={styles.eventCardMeta}>{formatEventDate(event.starts_at, event.ends_at)}</span>
                <span className={styles.eventCardMeta}>{event.location || "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
