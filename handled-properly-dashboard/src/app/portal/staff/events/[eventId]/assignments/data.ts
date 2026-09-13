import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import { getCommentsByAssignment } from "@/lib/data/assignment-comments";
import { getAssignmentDependencies } from "@/lib/data/assignment-dependencies";
import type { StaffAssignmentData } from "./StaffAssignmentCard";

// Shared by the event page's inline Assignments board and the standalone
// per-assignment detail page (linked from the staff dashboard's "Your
// Assignments" cards) — both need the exact same tree, with dependencies
// and comments resolved the same way, so this is fetched once here instead
// of duplicated in each page.
export async function getStaffAssignments(eventId: string): Promise<StaffAssignmentData[]> {
  const supabase = await createSupabaseServerClient();

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select(
      "id, parent_assignment_id, title, description, status, due_date, priority, pickup_setting, assignment_assignees(event_staff(id, contacts(name)))"
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

  return buildAssignmentTree(flatAssignments);
}

// A dashboard card can link to a Subtask, which the tree nests under its
// parent rather than at the root — so finding it back by id has to walk
// down, not just index the top level.
export function findAssignment(nodes: StaffAssignmentData[], id: string): StaffAssignmentData | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findAssignment(node.subtasks, id);
    if (found) return found;
  }
  return null;
}
