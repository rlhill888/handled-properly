import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import { getCommentsByAssignment } from "@/lib/data/assignment-comments";
import { getAssignmentDependencies } from "@/lib/data/assignment-dependencies";
import type { AssignmentData } from "./AssignmentCard";
import type { StaffOption } from "./NewAssignmentForm";

export async function getAssignmentsBoardData(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const [
    { data: rosterRows },
    { data: assignmentRows },
    { data: rosterCategoryRows },
    { data: allCategoryLinkRows },
    { data: eventTaskRows },
  ] = await Promise.all([
    supabase
      .from("roster_entries")
      .select("event_staff(id, contacts(name))")
      .eq("event_id", eventId),
    supabase
      .from("assignments")
      .select(
        "id, parent_assignment_id, title, description, status, tags, due_date, priority, pickup_setting, assignment_assignees(event_staff(id, contacts(name)))"
      )
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
    // Roster tags — lets the assignee picker match a search term like
    // "Catering" against a staff member's category, not just their name.
    supabase
      .from("roster_categories")
      .select("name, roster_entry_categories(event_staff_id)")
      .eq("event_id", eventId),
    // Every roster-category a staff member has ever been assigned, across
    // ALL events (no event_id filter) — merged alongside the
    // current-event-only roster tags above, so e.g. someone tagged
    // "Catering" on a past event still surfaces here even if this event
    // hasn't tagged them that way yet.
    supabase.from("roster_entry_categories").select("event_staff_id, roster_categories(name)"),
    supabase
      .from("event_tasks")
      .select("id, title")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  const categoryNamesByStaff = new Map<string, string[]>();
  for (const row of rosterCategoryRows ?? []) {
    for (const entry of row.roster_entry_categories) {
      const list = categoryNamesByStaff.get(entry.event_staff_id) ?? [];
      list.push(row.name);
      categoryNamesByStaff.set(entry.event_staff_id, list);
    }
  }

  const globalTagNamesByStaff = new Map<string, string[]>();
  for (const link of allCategoryLinkRows ?? []) {
    if (!link.roster_categories) continue;
    const list = globalTagNamesByStaff.get(link.event_staff_id) ?? [];
    list.push(link.roster_categories.name);
    globalTagNamesByStaff.set(link.event_staff_id, list);
  }

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
      categoryNames: categoryNamesByStaff.get(r.event_staff!.id) ?? [],
      globalTagNames: globalTagNamesByStaff.get(r.event_staff!.id) ?? [],
    }));

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
    eventTaskId: eventTaskIdByAssignment.get(row.id) ?? null,
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
