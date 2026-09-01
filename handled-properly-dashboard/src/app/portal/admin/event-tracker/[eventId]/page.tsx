import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import MarkCompletedButton from "./MarkCompletedButton";
import RosterManager from "./RosterManager";
import ConversationSettingToggle from "./ConversationSettingToggle";
import EventHeaderImageSettings from "./EventHeaderImageSettings";
import AssignmentsBoard from "./AssignmentsBoard";
import EventTasksBoard from "./event-tasks/EventTasksBoard";
import RequestsPanel from "./requests/RequestsPanel";
import DocumentationPanel from "./documentation/DocumentationPanel";
import EventVendorsPanel from "./event-vendors/EventVendorsPanel";
import FormsPanel from "@/components/portal/FormsPanel";
import SettingsModalButton from "@/components/portal/SettingsModalButton";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
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
      "id, name, starts_at, location, status, completed_at, staff_can_start_conversations, header_image_path, client:clients(company_name,contacts(name)), series:event_series(id, label)"
    )
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const clientName = event.client?.company_name || event.client?.contacts?.name || "—";
  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);

  const [
    { data: rosterRows },
    { data: allStaff },
    { data: availableForms },
    { data: eventForms },
    { data: rosterCategoryRows },
    { data: allCategoryLinkRows },
  ] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff_id, event_staff(id, contacts(name, email))")
      .eq("event_id", eventId),
    supabase.from("event_staff").select("id, contacts(name, email)"),
    supabase.from("forms").select("id, name").is("target_type", null).order("name", { ascending: true }),
    supabase
      .from("forms")
      .select("id, name, staff_visible")
      .eq("target_type", "event")
      .eq("target_id", eventId),
    supabase
      .from("roster_categories")
      .select("id, name, roster_entry_categories(event_staff_id)")
      .eq("event_id", eventId)
      .order("name", { ascending: true }),
    // Every roster-category a staff member has ever been assigned, across
    // ALL events (no event_id filter here, unlike the query above) — lets
    // the "add staff to roster" picker below match a search term like
    // "Catering" against a staff member's history, not just this event.
    supabase.from("roster_entry_categories").select("event_staff_id, roster_categories(name)"),
  ]);

  const rosterCategories = (rosterCategoryRows ?? []).map((row) => ({
    id: row.id,
    name: row.name,
  }));

  const categoryIdsByStaff = new Map<string, string[]>();
  for (const row of rosterCategoryRows ?? []) {
    for (const entry of row.roster_entry_categories) {
      const list = categoryIdsByStaff.get(entry.event_staff_id) ?? [];
      list.push(row.id);
      categoryIdsByStaff.set(entry.event_staff_id, list);
    }
  }

  const tagNamesByStaff = new Map<string, string[]>();
  for (const link of allCategoryLinkRows ?? []) {
    if (!link.roster_categories) continue;
    const list = tagNamesByStaff.get(link.event_staff_id) ?? [];
    list.push(link.roster_categories.name);
    tagNamesByStaff.set(link.event_staff_id, list);
  }

  const rosterMembers = (rosterRows ?? [])
    .filter((row) => row.event_staff?.contacts)
    .map((row) => ({
      id: row.event_staff!.id,
      name: row.event_staff!.contacts!.name,
      email: row.event_staff!.contacts!.email,
      categoryIds: categoryIdsByStaff.get(row.event_staff!.id) ?? [],
      tagNames: tagNamesByStaff.get(row.event_staff!.id) ?? [],
    }));

  const rosterIds = new Set(rosterMembers.map((m) => m.id));
  const availableStaff = (allStaff ?? [])
    .filter((staff) => staff.contacts && !rosterIds.has(staff.id))
    .map((staff) => ({
      id: staff.id,
      name: staff.contacts!.name,
      email: staff.contacts!.email,
      tagNames: tagNamesByStaff.get(staff.id) ?? [],
    }));

  const scopedForms = (eventForms ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    staffVisible: f.staff_visible,
  }));

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
            {event.series && <span className={styles.pill}>Series: {event.series.label}</span>}
          </div>
        </div>
        <div className={styles.actions}>
          {CHAT_ENABLED && (
            <Link
              href={`/portal/admin/event-tracker/${event.id}/conversations`}
              className={styles.backLink}
              aria-label="View Conversations"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
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

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Details</h2>
        <table className={`${styles.table} ${styles.keyValueTable}`}>
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
      </div>

      <AssignmentsBoard eventId={event.id} isLocked={event.status === "completed"} />

      <EventTasksBoard eventId={event.id} isLocked={event.status === "completed"} />

      <RequestsPanel eventId={event.id} isLocked={event.status === "completed"} />

      <DocumentationPanel eventId={event.id} isLocked={event.status === "completed"} />

      <EventVendorsPanel eventId={event.id} />

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Roster</h2>
        <RosterManager
          eventId={event.id}
          rosterMembers={rosterMembers}
          availableStaff={availableStaff}
          categories={rosterCategories}
          isLocked={event.status === "completed"}
        />
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Forms</h2>
        <FormsPanel
          targetType="event"
          targetId={event.id}
          basePath={`/portal/admin/event-tracker/${event.id}`}
          availableForms={availableForms ?? []}
          forms={scopedForms}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      </div>
    </div>
  );
}
