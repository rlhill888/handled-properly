import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import { getCommentsByAssignment } from "@/lib/data/assignment-comments";
import { getAssignmentDependencies } from "@/lib/data/assignment-dependencies";
import type { AssignmentData } from "./AssignmentCard";
import type { StaffOption } from "./NewAssignmentForm";

export async function getAssignmentsBoardData(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: rosterRows }, { data: assignmentRows }, { data: eventTaskRows }] =
    await Promise.all([
      supabase
        .from("roster_entries")
        .select("event_staff(id, contacts(name))")
        .eq("event_id", eventId),
      supabase
        .from("assignments")
        .select(
          "id, parent_assignment_id, title, description, status, due_date, pickup_setting, assignment_assignees(event_staff(id, contacts(name)))"
        )
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
      supabase
        .from("event_tasks")
        .select("id, title")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true }),
    ]);

  const assignmentIds = (assignmentRows ?? []).map((row) => row.id);

  // Which Event Task (if any) each Assignment is associated with — an
  // Assignment can only ever link to one from this form (the underlying
  // join table is many-to-many, but that only matters from the Event
  // Task's own picker; here it's a single-select convenience).
  const { data: taskAssignmentRows } =
    assignmentIds.length > 0
      ? await supabase
          .from("event_task_assignments")
          .select("event_task_id, assignment_id")
          .in("assignment_id", assignmentIds)
      : { data: [] };

  const eventTaskIdByAssignment = new Map<string, string>();
  for (const link of taskAssignmentRows ?? []) {
    if (!eventTaskIdByAssignment.has(link.assignment_id)) {
      eventTaskIdByAssignment.set(link.assignment_id, link.event_task_id);
    }
  }

  // Which Vendor Needs (items a vendor requested) each Assignment is meant
  // to fulfill — set from the Vendor Details card's "Vendor requests" modal.
  const { data: vendorNeedAssignmentRows } =
    assignmentIds.length > 0
      ? await supabase
          .from("vendor_need_assignments")
          .select("assignment_id, vendor_needs(id, item, contacts(name))")
          .in("assignment_id", assignmentIds)
      : { data: [] };

  const vendorNeedsByAssignment = new Map<string, { id: string; item: string; vendorName: string }[]>();
  for (const row of vendorNeedAssignmentRows ?? []) {
    if (!row.vendor_needs) continue;
    const list = vendorNeedsByAssignment.get(row.assignment_id) ?? [];
    list.push({
      id: row.vendor_needs.id,
      item: row.vendor_needs.item,
      vendorName: row.vendor_needs.contacts?.name ?? "Unknown vendor",
    });
    vendorNeedsByAssignment.set(row.assignment_id, list);
  }

  const commentsByAssignment = await getCommentsByAssignment(supabase, assignmentIds);

  const { dependsOnByAssignment, blocksByAssignment } = await getAssignmentDependencies(
    supabase,
    (assignmentRows ?? []).map((row) => ({ id: row.id, title: row.title, status: row.status }))
  );

  const rosterStaff: StaffOption[] = (rosterRows ?? [])
    .filter((r) => r.event_staff?.contacts)
    .map((r) => ({
      id: r.event_staff!.id,
      name: r.event_staff!.contacts!.name,
    }));

  const flatAssignments = (assignmentRows ?? []).map((row) => ({
    id: row.id,
    parentAssignmentId: row.parent_assignment_id,
    title: row.title,
    description: row.description,
    status: row.status,
    dueDate: row.due_date,
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
    eventTaskId: eventTaskIdByAssignment.get(row.id) ?? null,
    vendorNeeds: vendorNeedsByAssignment.get(row.id) ?? [],
  }));

  const assignments: AssignmentData[] = buildAssignmentTree(flatAssignments);

  const allAssignments = (assignmentRows ?? []).map((row) => ({ id: row.id, title: row.title }));
  const eventTasks = (eventTaskRows ?? []).map((row) => ({ id: row.id, title: row.title }));

  return {
    assignments,
    rosterStaff,
    allAssignments,
    eventTasks,
  };
}
