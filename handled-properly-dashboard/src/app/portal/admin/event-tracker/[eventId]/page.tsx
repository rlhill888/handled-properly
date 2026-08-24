import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import MarkCompletedButton from "./MarkCompletedButton";
import RosterManager from "./RosterManager";
import ConversationSettingToggle from "./ConversationSettingToggle";
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
      "id, name, starts_at, location, status, completed_at, staff_can_start_conversations, client:clients(company_name,contacts(name)), series:event_series(id, label)"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";

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

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/event-tracker" className={styles.link}>
        ← Back to Events
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
            {event.series && <span className={styles.pill}>Series: {event.series.label}</span>}
          </div>
        </div>
        <div className={styles.actions}>
          <Link href={`/portal/admin/event-tracker/${event.id}/assignments`} className={styles.secondaryButton}>
            View Assignments
          </Link>
          <Link href={`/portal/admin/event-tracker/${event.id}/conversations`} className={styles.secondaryButton}>
            View Conversations
          </Link>
          {event.status === "active" && <MarkCompletedButton eventId={event.id} />}
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td>Client</td>
              <td>{clientName}</td>
            </tr>
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
        <div style={{ marginTop: 16 }}>
          <ConversationSettingToggle
            eventId={event.id}
            initialAllowed={event.staff_can_start_conversations}
            disabled={event.status === "completed"}
          />
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Roster</h2>
        <RosterManager
          eventId={event.id}
          rosterMembers={rosterMembers}
          availableStaff={availableStaff}
          isLocked={event.status === "completed"}
        />
      </div>
    </div>
  );
}
