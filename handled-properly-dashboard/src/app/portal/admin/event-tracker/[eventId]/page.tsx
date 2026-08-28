import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import MarkCompletedButton from "./MarkCompletedButton";
import RosterManager from "./RosterManager";
import ConversationSettingToggle from "./ConversationSettingToggle";
import AssignmentsBoard from "./AssignmentsBoard";
import FormAttachmentManager from "@/components/portal/FormAttachmentManager";
import SettingsModalButton from "@/components/portal/SettingsModalButton";
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

  const [
    { data: rosterRows },
    { data: allStaff },
    { data: formTemplates },
    { data: formAttachments },
    { data: rosterCategoryRows },
  ] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff_id, event_staff(id, contacts(name, email))")
      .eq("event_id", eventId),
    supabase.from("event_staff").select("id, contacts(name, email)"),
    supabase.from("form_templates").select("id, name").order("name", { ascending: true }),
    supabase
      .from("form_attachments")
      .select("id, staff_visible, form_templates(id, name)")
      .eq("target_type", "event")
      .eq("target_id", eventId),
    supabase
      .from("roster_categories")
      .select("id, name, roster_entry_categories(event_staff_id)")
      .eq("event_id", eventId)
      .order("name", { ascending: true }),
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

  const rosterMembers = (rosterRows ?? [])
    .filter((row) => row.event_staff?.contacts)
    .map((row) => ({
      id: row.event_staff!.id,
      name: row.event_staff!.contacts!.name,
      email: row.event_staff!.contacts!.email,
      categoryIds: categoryIdsByStaff.get(row.event_staff!.id) ?? [],
    }));

  const rosterIds = new Set(rosterMembers.map((m) => m.id));
  const availableStaff = (allStaff ?? [])
    .filter((staff) => staff.contacts && !rosterIds.has(staff.id))
    .map((staff) => ({
      id: staff.id,
      name: staff.contacts!.name,
      email: staff.contacts!.email,
    }));

  const attachedForms = (formAttachments ?? [])
    .filter((a) => a.form_templates)
    .map((a) => ({
      id: a.id,
      templateId: a.form_templates!.id,
      templateName: a.form_templates!.name,
      staffVisible: a.staff_visible,
    }));

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/event-tracker" className={styles.backLink} aria-label="Back to Events">
        ←
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

          <SettingsModalButton>
            <div className={styles.form}>
              <ConversationSettingToggle
                eventId={event.id}
                initialAllowed={event.staff_can_start_conversations}
                disabled={event.status === "completed"}
              />

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
        <FormAttachmentManager
          targetType="event"
          targetId={event.id}
          basePath={`/portal/admin/event-tracker/${event.id}`}
          availableTemplates={formTemplates ?? []}
          attached={attachedForms}
          siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""}
        />
      </div>
    </div>
  );
}
