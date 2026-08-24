import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import NewAssignmentForm, { type StaffOption } from "./NewAssignmentForm";
import AssignmentCard, { type AssignmentData } from "./AssignmentCard";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "./assignments.module.css";

const COLUMNS: { status: AssignmentData["status"]; label: string }[] = [
  { status: "ready", label: "Ready to Work" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export default async function EventAssignmentsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: rosterRows }, { data: assignmentRows }] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff(id, contacts(name))")
      .eq("event_id", eventId),
    supabase
      .from("assignments")
      .select(
        "id, title, description, status, tags, due_date, priority, pickup_setting, assignment_assignees(event_staff(id, contacts(name)))"
      )
      .eq("event_id", eventId)
      .is("parent_assignment_id", null)
      .order("created_at", { ascending: true }),
  ]);

  const rosterStaff: StaffOption[] = (rosterRows ?? [])
    .filter((r) => r.event_staff?.contacts)
    .map((r) => ({ id: r.event_staff!.id, name: r.event_staff!.contacts!.name }));

  const assignments: AssignmentData[] = (assignmentRows ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    tags: row.tags,
    dueDate: row.due_date,
    priority: row.priority,
    pickupSetting: row.pickup_setting,
    assigneeIds: row.assignment_assignees
      .map((a) => a.event_staff?.id)
      .filter((id): id is string => Boolean(id)),
    assigneeNames: row.assignment_assignees
      .map((a) => a.event_staff?.contacts?.name)
      .filter((name): name is string => Boolean(name)),
  }));

  const isLocked = event.status === "completed";

  return (
    <div className={styles.page}>
      <Link href={`/portal/admin/event-tracker/${eventId}`} className={styles.link}>
        ← Back to {event.name}
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Assignments</span>
          <h1 className={styles.title}>{event.name}</h1>
        </div>
      </div>

      {!isLocked && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>New Assignment</h2>
          <NewAssignmentForm eventId={eventId} rosterStaff={rosterStaff} />
        </div>
      )}

      <div className={boardStyles.board}>
        {COLUMNS.map((column) => (
          <div key={column.status} className={boardStyles.column}>
            <div className={boardStyles.columnHeader}>
              <span>{column.label}</span>
              <span>{assignments.filter((a) => a.status === column.status).length}</span>
            </div>
            {assignments
              .filter((a) => a.status === column.status)
              .map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  eventId={eventId}
                  assignment={assignment}
                  rosterStaff={rosterStaff}
                  isLocked={isLocked}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
