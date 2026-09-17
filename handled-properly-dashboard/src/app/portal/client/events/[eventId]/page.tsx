import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import EventHeaderImage from "@/components/portal/EventHeaderImage";
import ClientEventTaskBoard, { type ClientEventTaskData } from "@/components/portal/ClientEventTaskBoard";
import ClientEventRequestsList from "@/components/portal/ClientEventRequestsList";
import CollapsibleCard from "@/components/portal/CollapsibleCard";
import VendorContactsButton from "@/components/portal/VendorContactsButton";
import CalendarIcon from "@/components/portal/CalendarIcon";
import LocationIcon from "@/components/portal/LocationIcon";
import FileIcon from "@/components/portal/FileIcon";
import CommentIcon from "@/components/portal/CommentIcon";
import ArrowIcon from "@/components/icons/ArrowIcon";
import { getEventHeaderImageDataUrl } from "@/lib/data/event-header-image";
import { formatEventDate } from "@/lib/format-event-date";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientEventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS restricts this to events belonging to the signed-in client — a
  // direct link to any other client's event id simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select("id, name, starts_at, ends_at, location, status, completed_at, header_image_path")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: taskRows }, { data: requests }, { data: eventVendors }, { data: rosterRows }] = await Promise.all([
    supabase
      .from("event_tasks")
      .select("id, title, description, status")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    supabase
      .from("requests")
      .select("id, title, due_date, fulfilled_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    // RLS (client_select_event_vendors / client_select_vendor_contacts)
    // already limits this to this event's Vendor list — no extra filter
    // needed.
    supabase.from("event_vendors").select("contacts(id, name, email, phone)").eq("event_id", eventId),
    // RLS (client_select_own_roster / client_select_staff_contacts) already
    // limits this to this event's Staff roster — no extra filter needed.
    supabase
      .from("roster_entries")
      .select("title, event_staff(id, contacts(id, name, email))")
      .eq("event_id", eventId),
  ]);

  const vendors = (eventVendors ?? [])
    .map((row) => row.contacts)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const staff = (rosterRows ?? [])
    .filter((row) => row.event_staff?.contacts)
    .map((row) => ({ ...row.event_staff!.contacts!, title: row.title }));

  const taskIds = (taskRows ?? []).map((row) => row.id);

  // Fetched up front (rather than on demand) so the Event Tasks board's
  // modal can show full details instantly.
  const { data: updateRows } = await supabase
    .from("event_task_updates")
    .select("id, event_task_id, body, created_at")
    .in("event_task_id", taskIds)
    .order("created_at", { ascending: true });

  const updatesByTask = new Map<string, ClientEventTaskData["updates"]>();
  for (const row of updateRows ?? []) {
    const list = updatesByTask.get(row.event_task_id) ?? [];
    list.push({ id: row.id, body: row.body, createdAt: row.created_at });
    updatesByTask.set(row.event_task_id, list);
  }

  // RLS (client_select_own_request_dependencies) scopes this to this
  // client's own event tasks — shows which Requests are still blocking each
  // one from moving forward.
  const { data: dependencyRows } = await supabase
    .from("request_dependencies")
    .select("event_task_id, requests(id, title, fulfilled_at)")
    .in("event_task_id", taskIds);

  const blockingRequestsByTask = new Map<string, ClientEventTaskData["blockingRequests"]>();
  for (const row of dependencyRows ?? []) {
    if (!row.requests || row.requests.fulfilled_at !== null) continue;
    const list = blockingRequestsByTask.get(row.event_task_id) ?? [];
    list.push({ id: row.requests.id, title: row.requests.title });
    blockingRequestsByTask.set(row.event_task_id, list);
  }

  const tasks: ClientEventTaskData[] = (taskRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    updates: updatesByTask.get(row.id) ?? [],
    blockingRequests: blockingRequestsByTask.get(row.id) ?? [],
  }));

  const headerImageUrl = await getEventHeaderImageDataUrl(event.header_image_path);

  return (
    <div className={styles.page}>
      <Link href="/portal/client/events" className={styles.backLink} aria-label="Back to My Events">
        ←
      </Link>

      <EventHeaderImage eventName={event.name} imageUrl={headerImageUrl} />

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event</span>
          <h1 className={styles.title}>{event.name}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={event.status === "completed" ? styles.badgeMuted : styles.badge}>
              {event.status === "completed" ? "Completed" : "Active"}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardHeading}>Event details</h2>
        <p className={styles.description}>Basic information about your event.</p>

        <div className={styles.factGrid}>
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

        <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
          <h3 className={styles.sectionHeading}>Resources</h3>
          <div className={styles.resourceGrid}>
            <Link href={`/portal/client/events/${event.id}/documentation`} className={styles.resourceCard}>
              <div className={styles.iconBox}>
                <FileIcon size={18} />
              </div>
              <div className={styles.resourceCardBody}>
                <p className={styles.resourceCardTitle}>Event documentation</p>
                <p className={styles.resourceCardSubtitle}>View event files and details</p>
              </div>
              <span className={styles.resourceCardArrow}>
                <ArrowIcon />
              </span>
            </Link>
            <VendorContactsButton vendors={vendors} staff={staff} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <div className={styles.resourceRow}>
            <CollapsibleCard
              title="Requests"
              description="Things the admin needs from you."
              badgeCount={(requests ?? []).filter((r) => !r.fulfilled_at).length}
              icon={<CommentIcon size={18} />}
              titleClassName={styles.resourceCardTitle}
              defaultOpen={false}
              bare
            >
              <ClientEventRequestsList
                eventId={event.id}
                requests={(requests ?? []).map((r) => ({
                  id: r.id,
                  title: r.title,
                  dueDate: r.due_date,
                  fulfilledAt: r.fulfilled_at,
                }))}
              />
            </CollapsibleCard>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Event Tasks</h2>
        <p className={styles.description}>Work being done for this event.</p>
        <ClientEventTaskBoard eventId={event.id} tasks={tasks} />
      </div>
    </div>
  );
}
