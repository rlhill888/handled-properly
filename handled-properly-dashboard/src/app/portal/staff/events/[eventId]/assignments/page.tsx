import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import StaffAssignmentCard, { type StaffAssignmentData } from "./StaffAssignmentCard";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

const COLUMNS: { status: StaffAssignmentData["status"]; label: string }[] = [
  { status: "ready", label: "Ready to Work" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export default async function StaffEventAssignmentsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();
  const actor = await getCurrentActor();
  const currentStaffId = actor?.role === "event_staff" ? actor.eventStaffId : null;

  // RLS (staff_select_rostered_events) scopes this — no row means either
  // the event doesn't exist or this staff member isn't on its roster.
  const { data: event } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select(
      "id, parent_assignment_id, title, description, status, tags, due_date, priority, pickup_setting, assignment_assignees(event_staff(id, contacts(name)))"
    )
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  const assignmentIds = (assignmentRows ?? []).map((row) => row.id);
  // RLS (staff_select_visible_form_attachments) already limits this to
  // staff_visible attachments on assignments this staff member is rostered
  // for — no extra filtering needed here.
  const { data: formAttachments } =
    assignmentIds.length > 0
      ? await supabase
          .from("form_attachments")
          .select("id, target_id, form_templates(name)")
          .eq("target_type", "assignment")
          .in("target_id", assignmentIds)
      : { data: [] };

  const visibleFormsByAssignment = new Map<string, { id: string; templateName: string }[]>();
  for (const a of formAttachments ?? []) {
    if (!a.form_templates) continue;
    const list = visibleFormsByAssignment.get(a.target_id) ?? [];
    list.push({ id: a.id, templateName: a.form_templates.name });
    visibleFormsByAssignment.set(a.target_id, list);
  }

  const flatAssignments = (assignmentRows ?? []).map((row) => ({
    id: row.id,
    parentAssignmentId: row.parent_assignment_id,
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
    visibleForms: visibleFormsByAssignment.get(row.id) ?? [],
  }));

  const assignments: StaffAssignmentData[] = buildAssignmentTree(flatAssignments);

  const isLocked = event.status === "completed";

  return (
    <div className={styles.page}>
      <Link href={`/portal/staff/events/${eventId}`} className={styles.link}>
        ← Back to {event.name}
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Assignments</span>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.description}>
            You see every assignment for this event, including ones not assigned to you.
          </p>
        </div>
      </div>

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
                <StaffAssignmentCard
                  key={assignment.id}
                  eventId={eventId}
                  assignment={assignment}
                  currentStaffId={currentStaffId}
                  isLocked={isLocked}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
