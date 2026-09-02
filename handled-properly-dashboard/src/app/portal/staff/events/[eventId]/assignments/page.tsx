import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { type StaffAssignmentData } from "./StaffAssignmentCard";
import StaffAssignmentBoardClient from "./StaffAssignmentBoardClient";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import { getCommentsByAssignment } from "@/lib/data/assignment-comments";
import { getAssignmentDependencies } from "@/lib/data/assignment-dependencies";
import styles from "@/styles/admin-shared.module.css";

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

  const commentsByAssignment = await getCommentsByAssignment(supabase, assignmentIds);

  const { dependsOnByAssignment, blocksByAssignment } = await getAssignmentDependencies(
    supabase,
    (assignmentRows ?? []).map((row) => ({ id: row.id, title: row.title, status: row.status }))
  );

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
    comments: commentsByAssignment.get(row.id) ?? [],
    dependsOn: dependsOnByAssignment.get(row.id) ?? [],
    blocks: blocksByAssignment.get(row.id) ?? [],
  }));

  const assignments: StaffAssignmentData[] = buildAssignmentTree(flatAssignments);

  const isLocked = event.status === "completed";

  return (
    <div className={styles.page}>
      <Link href={`/portal/staff/events/${eventId}`} className={styles.backLink} aria-label={`Back to ${event.name}`}>
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Assignments</span>
          <h1 className={styles.title}>{event.name}</h1>
          <p className={styles.description}>
            You see every assignment for this event, including ones not assigned to you. Drag your
            own assignments between columns to update their status, or tap ▾ for full details.
          </p>
        </div>
      </div>

      <StaffAssignmentBoardClient
        eventId={eventId}
        assignments={assignments}
        currentStaffId={currentStaffId}
        isLocked={isLocked}
      />
    </div>
  );
}
