import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import CalendarIcon from "@/components/portal/CalendarIcon";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import { getVendorEventDetail, getVendorNeeds } from "./data";
import VendorNeedsList from "./VendorNeedsList";
import styles from "@/styles/admin-shared.module.css";

export default async function VendorEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS restricts this to events this vendor is on the Vendor List for, and
  // only while their access hasn't auto-expired (is_vendor_for_event) — a
  // stale link to another event, or one whose access has since expired,
  // simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, location, header_image_path, vendor_needs_due_date")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const needsDeadlinePassed = Boolean(
    event.vendor_needs_due_date && new Date(event.vendor_needs_due_date) < new Date()
  );

  const [detail, headerImageUrl, needs] = await Promise.all([
    getVendorEventDetail(eventId),
    getEventHeaderImageDataUrl(event.header_image_path),
    getVendorNeeds(eventId),
  ]);

  return (
    <div className={styles.page}>
      <Link href="/portal/vendor/events" className={styles.backLink} aria-label="Back to Your Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Vendor · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
          <tbody>
            <tr>
              <td>Date &amp; time</td>
              <td>{formatEventDate(event.starts_at, event.ends_at)}</td>
            </tr>
            <tr>
              <td>Event location</td>
              <td>{event.location || "—"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Arrival &amp; Setup</h2>
        {!detail || !detail.arrivalTime ? (
          <p className={styles.emptyState}>
            The event organizer hasn&apos;t added your arrival details yet — check back soon.
          </p>
        ) : (
          <table className={`${styles.table} ${styles.keyValueTable}`}>
            <tbody>
              <tr>
                <td>Arrival time</td>
                <td>{new Date(detail.arrivalTime).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Arrival location</td>
                <td>{detail.arrivalLocation || "—"}</td>
              </tr>
              {detail.setupTime && (
                <tr>
                  <td>Setup time</td>
                  <td>{new Date(detail.setupTime).toLocaleString()}</td>
                </tr>
              )}
              {detail.setupLocation && (
                <tr>
                  <td>Setup location</td>
                  <td>{detail.setupLocation}</td>
                </tr>
              )}
              {detail.locationPhotoUrl && (
                <tr>
                  <td>Setup photo</td>
                  <td>
                    <img
                      src={detail.locationPhotoUrl}
                      alt="Where to set up"
                      style={{ maxWidth: 360, borderRadius: 4 }}
                    />
                  </td>
                </tr>
              )}
              <tr>
                <td>Parking</td>
                <td>{detail.parkingInstructions || "—"}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Items You Need For The Event</h2>
        <p className={styles.description}>
          Let the event organizer know what you need for this event — a table, a power outlet,
          extra parking, anything else.
        </p>
        {event.vendor_needs_due_date && !needsDeadlinePassed && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "-8px 0 16px",
              color: "#b3261e",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            <CalendarIcon size={14} />
            Please submit requested items by {new Date(event.vendor_needs_due_date).toLocaleString()}.
          </p>
        )}
        {needsDeadlinePassed && (
          <p className={styles.error}>
            The deadline to request items for this event has passed. Contact the event organizer
            directly if you still need something.
          </p>
        )}
        <VendorNeedsList eventId={eventId} needs={needs} canAdd={!needsDeadlinePassed} />
      </div>
    </div>
  );
}
