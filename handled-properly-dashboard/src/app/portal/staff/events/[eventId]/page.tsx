import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import CalendarIcon from "@/components/portal/CalendarIcon";
import LocationIcon from "@/components/portal/LocationIcon";
import PersonIcon from "@/components/portal/PersonIcon";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import { CHAT_ENABLED } from "@/lib/feature-flags";
import StaffAssignmentBoardClient from "./assignments/StaffAssignmentBoardClient";
import { getStaffAssignments } from "./assignments/data";
import StaffEventTaskBoard, { type StaffEventTaskData } from "./StaffEventTaskBoard";
import ModalButton from "@/components/portal/ModalButton";
import styles from "@/styles/admin-shared.module.css";

export default async function StaffEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();
  const actor = await getCurrentActor();
  const currentStaffId = actor?.role === "event_staff" ? actor.eventStaffId : null;

  // RLS restricts this to events the signed-in staff member is rostered
  // on — a direct link to any other event's id simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, name, starts_at, ends_at, location, status, completed_at, header_image_path, client:clients(company_name,contacts(name))"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";
  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);
  const isLocked = event.status === "completed";

  // The admin's title for the signed-in staff member on this event (e.g.
  // "Modeling Director"), if one's been set — RLS (staff_select_own_roster)
  // already scopes this to events they're rostered on.
  const { data: ownRosterEntry } = currentStaffId
    ? await supabase
        .from("roster_entries")
        .select("title")
        .eq("event_id", eventId)
        .eq("event_staff_id", currentStaffId)
        .maybeSingle()
    : { data: null };
  const myTitle = ownRosterEntry?.title ?? null;

  const assignments = await getStaffAssignments(eventId);

  // Every item a vendor has requested for this event, regardless of whether
  // it's been linked to an Assignment yet — the staff-side counterpart to
  // the admin's "Vendor requests" modal, so staff can see the full request
  // list even for items nobody's picked up work on yet. RLS
  // (staff_select_rostered_vendor_needs) scopes this to events the staff
  // member is rostered on.
  const { data: vendorNeedRows } = await supabase
    .from("vendor_needs")
    .select("id, item, contacts(name)")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const vendorNeedGroups: { vendorName: string; needs: { id: string; item: string }[] }[] = [];
  for (const row of vendorNeedRows ?? []) {
    const vendorName = row.contacts?.name ?? "Unknown vendor";
    const group = vendorNeedGroups.find((g) => g.vendorName === vendorName);
    if (group) group.needs.push({ id: row.id, item: row.item });
    else vendorNeedGroups.push({ vendorName, needs: [{ id: row.id, item: row.item }] });
  }

  // The admin's notes on each vendor for this event — staff-visible per
  // staff_select_vendor_event_details, even though the vendor themselves
  // never sees this field.
  const { data: vendorNoteRows } = await supabase
    .from("vendor_event_details")
    .select("contact_id, admin_notes, contacts(name)")
    .eq("event_id", eventId)
    .not("admin_notes", "is", null);

  const vendorNotes = (vendorNoteRows ?? [])
    .filter((row) => row.admin_notes)
    .map((row) => ({
      contactId: row.contact_id,
      vendorName: row.contacts?.name ?? "Unknown vendor",
      note: row.admin_notes as string,
    }));

  // The same Event Tasks the Client sees for this event, read-only — only
  // the admin moves them.
  const { data: taskRows } = await supabase
    .from("event_tasks")
    .select("id, title, description, status")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const taskIds = (taskRows ?? []).map((row) => row.id);

  // Fetched up front (rather than on demand) so the task board's modal can
  // show full details instantly, the same way the Assignments board above
  // already prefetches everything for its own modal.
  const { data: updateRows } = await supabase
    .from("event_task_updates")
    .select("id, event_task_id, body, created_at")
    .in("event_task_id", taskIds)
    .order("created_at", { ascending: true });

  const updatesByTask = new Map<string, StaffEventTaskData["updates"]>();
  for (const row of updateRows ?? []) {
    const list = updatesByTask.get(row.event_task_id) ?? [];
    list.push({ id: row.id, body: row.body, createdAt: row.created_at });
    updatesByTask.set(row.event_task_id, list);
  }

  // RLS (staff_select_rostered_event_task_assignments) scopes this to this
  // event's own tasks — shows the staff-side work behind each Event Task.
  const { data: linkRows } = await supabase
    .from("event_task_assignments")
    .select(
      "event_task_id, assignments(id, title, description, status, due_date, assignment_assignees(event_staff(contacts(name))))"
    )
    .in("event_task_id", taskIds);

  const linkedAssignmentsByTask = new Map<string, StaffEventTaskData["linkedAssignments"]>();
  for (const row of linkRows ?? []) {
    if (!row.assignments) continue;
    const a = row.assignments;
    const list = linkedAssignmentsByTask.get(row.event_task_id) ?? [];
    list.push({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      dueDate: a.due_date,
      assigneeNames: (a.assignment_assignees ?? [])
        .map((aa) => aa.event_staff?.contacts?.name)
        .filter((name): name is string => Boolean(name)),
    });
    linkedAssignmentsByTask.set(row.event_task_id, list);
  }

  const tasks: StaffEventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    updates: updatesByTask.get(row.id) ?? [],
    linkedAssignments: linkedAssignmentsByTask.get(row.id) ?? [],
  }));

  return (
    <div className={styles.page}>
      <Link href="/portal/staff/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
            {myTitle && <span className={styles.pill}>{myTitle}</span>}
          </div>
        </div>
        {CHAT_ENABLED && (
          <div className={styles.actions}>
            <Link
              href={`/portal/staff/events/${event.id}/conversations`}
              className={styles.secondaryButton}
            >
              View Conversations
            </Link>
          </div>
        )}
      </div>

      <div className={styles.card}>
        <div className={styles.cardHeaderRow} style={{ justifyContent: "space-between" }}>
          <div>
            <h2 className={styles.cardHeading}>Event details</h2>
            <p className={styles.description} style={{ marginBottom: 0 }}>
              Basic info about this event.
            </p>
          </div>
          {(vendorNeedGroups.length > 0 || vendorNotes.length > 0) && (
            <ModalButton
              label="Vendor Details"
              modalTitle="Vendor Details"
              className={styles.secondaryButton}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 24, padding: "20px 24px" }}>
                <div>
                  <h3 className={styles.cardTitle}>Requested Items</h3>
                  {vendorNeedGroups.length === 0 ? (
                    <p className={styles.emptyState}>No vendors have requested anything for this event.</p>
                  ) : (
                    <div className={styles.accordionItem}>
                      {vendorNeedGroups.map((group) => (
                        <div key={group.vendorName}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              padding: "10px 16px",
                              background: "var(--surface)",
                              borderBottom: "1px solid var(--border)",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--foreground)",
                            }}
                          >
                            {group.vendorName}
                            <span className={styles.optional}>
                              {group.needs.length} item{group.needs.length === 1 ? "" : "s"}
                            </span>
                          </div>
                          <ul style={{ margin: 0, padding: "6px 16px 6px 32px" }}>
                            {group.needs.map((need) => (
                              <li key={need.id} style={{ padding: "4px 0", fontSize: 13, wordBreak: "break-word" }}>
                                {need.item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {vendorNotes.length > 0 && (
                  <div>
                    <h3 className={styles.cardTitle}>Vendor Notes</h3>
                    <div className={styles.accordionItem}>
                      {vendorNotes.map((entry) => (
                        <div key={entry.contactId}>
                          <div
                            style={{
                              padding: "10px 16px",
                              background: "var(--surface)",
                              borderBottom: "1px solid var(--border)",
                              fontSize: 14,
                              fontWeight: 700,
                              color: "var(--foreground)",
                            }}
                          >
                            {entry.vendorName}
                          </div>
                          <p style={{ margin: 0, padding: "6px 16px", fontSize: 13, wordBreak: "break-word" }}>
                            {entry.note}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ModalButton>
          )}
        </div>

        <div className={styles.factGrid}>
          <div className={styles.factItem}>
            <div className={styles.iconBox}>
              <PersonIcon size={18} />
            </div>
            <div>
              <p className={styles.factLabel}>Client</p>
              <p className={styles.factValue}>{clientName}</p>
            </div>
          </div>
          <div className={styles.factDivider} />
          <div className={styles.factItem}>
            <div className={styles.iconBox}>
              <CalendarIcon size={18} />
            </div>
            <div>
              <p className={styles.factLabel}>Date &amp; time</p>
              <p className={styles.factValue}>{formatEventDate(event.starts_at, event.ends_at)}</p>
              {event.completed_at && (
                <p className={styles.factSub}>Completed {new Date(event.completed_at).toLocaleString()}</p>
              )}
            </div>
          </div>
          <div className={styles.factDivider} />
          <div className={styles.factItem}>
            <div className={styles.iconBox}>
              <LocationIcon size={18} />
            </div>
            <div>
              <p className={styles.factLabel}>Location</p>
              <p className={styles.factValue}>{event.location || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Assignments</h2>
        <p className={styles.description}>
          All staff assignments for this event. Drag your own assignments between columns to
          update their status, or tap ▾ for full details.
        </p>
        <StaffAssignmentBoardClient
          eventId={eventId}
          assignments={assignments}
          currentStaffId={currentStaffId}
          isLocked={isLocked}
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Event Tasks</h2>
        <p className={styles.description}>
          Tasks for an event that the client sees (the client does not see staff assignments).
        </p>
        <StaffEventTaskBoard eventId={eventId} tasks={tasks} />
      </div>
    </div>
  );
}
