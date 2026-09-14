import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import MarkCompletedButton from "./MarkCompletedButton";
import RosterManager from "./RosterManager";
import ConversationSettingToggle from "./ConversationSettingToggle";
import EventHeaderImageSettings from "./EventHeaderImageSettings";
import AssignmentsBoard from "./AssignmentsBoard";
import EventDetailTabs from "./EventDetailTabs";
import EventTasksBoard from "./event-tasks/EventTasksBoard";
import RequestsPanel from "./requests/RequestsPanel";
import DocumentationPanel from "./documentation/DocumentationPanel";
import EventVendorsPanel from "./event-vendors/EventVendorsPanel";
import VendorDetailsPanel from "./event-vendors/VendorDetailsPanel";
import SettingsModalButton from "@/components/portal/SettingsModalButton";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import CommentIcon from "@/components/portal/CommentIcon";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import { CHAT_ENABLED } from "@/lib/feature-flags";
import styles from "@/styles/admin-shared.module.css";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, ends_at, location, status, completed_at, staff_can_start_conversations, header_image_path, client:clients(company_name,contacts(name))"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";
  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);

  const [{ data: rosterRows }, { data: allStaff }] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff_id, event_staff(id, contacts(name, email))")
      .eq("event_id", eventId),
    supabase.from("event_staff").select("id, contacts(name, email)"),
  ]);

  const rosterMembers = (rosterRows ?? [])
    .filter((row) => row.event_staff?.contacts)
    .map((row) => ({
      id: row.event_staff!.id,
      name: row.event_staff!.contacts!.name,
      email: row.event_staff!.contacts!.email,
    }));

  const rosterIds = new Set(rosterMembers.map((m) => m.id));
  const availableStaff = (allStaff ?? [])
    .filter((staff) => staff.contacts && !rosterIds.has(staff.id))
    .map((staff) => ({
      id: staff.id,
      name: staff.contacts!.name,
      email: staff.contacts!.email,
    }));

  // Shown on both tabs — see EventDetailTabs.
  const detailsCard = (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Details</h2>
      <p className={styles.description}>Basic info about this event.</p>
      <table className={`${styles.table} ${styles.keyValueTable}`}>
        <tbody>
          <tr>
            <td>Client</td>
            <td>{clientName}</td>
          </tr>
          <tr>
            <td>Date &amp; time</td>
            <td>{formatEventDate(event.starts_at, event.ends_at)}</td>
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
    </div>
  );

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/event-tracker" className={styles.backLink} aria-label="Back to Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          {CHAT_ENABLED && (
            <Link
              href={`/portal/admin/event-tracker/${event.id}/conversations`}
              className={styles.backLink}
              aria-label="View Conversations"
            >
              <CommentIcon size={16} />
            </Link>
          )}

          <SettingsModalButton>
            <div className={styles.form}>
              {CHAT_ENABLED && (
                <ConversationSettingToggle
                  eventId={event.id}
                  initialAllowed={event.staff_can_start_conversations}
                  disabled={event.status === "completed"}
                />
              )}

              <EventHeaderImageSettings eventId={event.id} hasImage={Boolean(event.header_image_path)} />

              {event.status === "active" && <MarkCompletedButton eventId={event.id} />}
            </div>
          </SettingsModalButton>
        </div>
      </div>

      <EventDetailTabs
        clientView={
          <>
            {detailsCard}

            <EventTasksBoard eventId={event.id} isLocked={event.status === "completed"} />

            <RequestsPanel eventId={event.id} isLocked={event.status === "completed"} />

            <DocumentationPanel eventId={event.id} isLocked={event.status === "completed"} />

            <EventVendorsPanel eventId={event.id} />
          </>
        }
        internal={
          <>
            {detailsCard}

            <AssignmentsBoard eventId={event.id} isLocked={event.status === "completed"} />

            <VendorDetailsPanel eventId={event.id} />

            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Roster</h2>
              <p className={styles.description}>The staff working this event.</p>
              <RosterManager
                eventId={event.id}
                rosterMembers={rosterMembers}
                availableStaff={availableStaff}
                isLocked={event.status === "completed"}
              />
            </div>
          </>
        }
      />
    </div>
  );
}
