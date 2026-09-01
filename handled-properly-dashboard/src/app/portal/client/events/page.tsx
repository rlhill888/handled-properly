import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventHeaderImageUrl } from "@/lib/data/event-header-image";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientEventsPage() {
  const supabase = await createSupabaseServerClient();

  // RLS (client_select_own_events) already scopes this to only this
  // client's own events — no extra filter needed here.
  const { data: events, error } = await supabase
    .from("events")
    .select("id, name, starts_at, location, status, header_image_path")
    .order("starts_at", { ascending: true, nullsFirst: false });

  const activeEvents = (events ?? []).filter((e) => e.status === "active");
  const completedEvents = (events ?? []).filter((e) => e.status === "completed");

  const [activeHeaderImageUrls, completedHeaderImageUrls] = await Promise.all([
    Promise.all(activeEvents.map((e) => getEventHeaderImageUrl(e.header_image_path))),
    Promise.all(completedEvents.map((e) => getEventHeaderImageUrl(e.header_image_path))),
  ]);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Client</span>
          <h1 className={styles.title}>My Events</h1>
          <p className={styles.description}>Events you&apos;re the client for.</p>
        </div>
      </div>

      {error && <p className={styles.error}>Could not load events: {error.message}</p>}

      <h2 className={styles.cardTitle}>Active ({activeEvents.length})</h2>
      {activeEvents.length === 0 ? (
        <p className={styles.emptyState}>No active events yet.</p>
      ) : (
        <div className={styles.eventCardGrid}>
          {activeEvents.map((event, i) => (
            <Link key={event.id} href={`/portal/client/events/${event.id}`} className={styles.eventCard}>
              {activeHeaderImageUrls[i] ? (
                <img src={activeHeaderImageUrls[i]!} alt="" className={styles.eventCardImage} />
              ) : (
                <div className={styles.eventCardImagePlaceholder}>No header image</div>
              )}
              <div className={styles.eventCardBody}>
                <span className={styles.eventCardTitle}>{event.name}</span>
                <span className={styles.eventCardMeta}>
                  {event.starts_at ? new Date(event.starts_at).toLocaleString() : "—"}
                </span>
                <span className={styles.eventCardMeta}>{event.location || "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {completedEvents.length > 0 && (
        <>
          <h2 className={styles.cardTitle}>Past Events ({completedEvents.length})</h2>
          <div className={styles.eventCardGrid}>
            {completedEvents.map((event, i) => (
              <Link
                key={event.id}
                href={`/portal/client/events/${event.id}`}
                className={styles.eventCard}
              >
                {completedHeaderImageUrls[i] ? (
                  <img src={completedHeaderImageUrls[i]!} alt="" className={styles.eventCardImage} />
                ) : (
                  <div className={styles.eventCardImagePlaceholder}>No header image</div>
                )}
                <div className={styles.eventCardBody}>
                  <span className={styles.eventCardTitle}>{event.name}</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
