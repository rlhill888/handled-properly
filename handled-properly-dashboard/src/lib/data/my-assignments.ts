import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type MyAssignmentSummary = {
  eventId: string;
  eventName: string;
  id: string;
  title: string;
  status: Database["public"]["Enums"]["assignment_status"];
  priority: Database["public"]["Enums"]["assignment_priority"];
  dueDate: string | null;
  // True if the status field is literally "blocked", OR (the far more
  // common real-world case) it's waiting on another assignment that isn't
  // done yet — same "blocked" definition AssignmentBoardClient.tsx already
  // uses for the admin Kanban board, just computed here instead of in JSX.
  isBlocked: boolean;
};

// For the staff /portal dashboard's compact assignment cards — every
// assignment this staff member is currently an assignee on, across ALL
// their events, still open (not "done") and on an event that's still
// active. Deliberately light: just enough fields for a compact card, not
// the full board's comments/forms (see StaffAssignmentCard for that fuller
// view, used on the per-event board instead).
export async function getMyAssignments(
  supabase: SupabaseClient<Database>,
  currentStaffId: string,
): Promise<MyAssignmentSummary[]> {
  const { data: assigneeLinkRows } = await supabase
    .from("assignment_assignees")
    .select("assignment_id")
    .eq("event_staff_id", currentStaffId);

  const assignedIds = [...new Set((assigneeLinkRows ?? []).map((r) => r.assignment_id))];
  if (assignedIds.length === 0) return [];

  const { data: assignmentRows } = await supabase
    .from("assignments")
    .select("id, event_id, title, status, priority, due_date, events(status, name)")
    .in("id", assignedIds)
    .neq("status", "done")
    .order("due_date", { ascending: true, nullsFirst: false });

  const openRows = (assignmentRows ?? []).filter((row) => row.events?.status === "active");
  const openIds = openRows.map((row) => row.id);

  // Not getAssignmentDependencies — that helper only resolves a dependency
  // when BOTH sides are in the list you hand it, which is fine for a
  // full-event fetch but wrong here: a prerequisite (e.g. "Confirm AV
  // vendor") is very often assigned to someone else entirely, not to this
  // staff member, so it would silently be dropped. Resolve prerequisite
  // status directly instead, regardless of who it's assigned to — RLS
  // (staff_select_rostered_assignments) already permits reading any
  // assignment on an event this staff member is rostered on.
  const { data: depRows } =
    openIds.length > 0
      ? await supabase
          .from("assignment_dependencies")
          .select("assignment_id, depends_on_assignment_id")
          .in("assignment_id", openIds)
      : { data: [] };

  const prerequisiteIds = [...new Set((depRows ?? []).map((d) => d.depends_on_assignment_id))];
  const { data: prerequisiteRows } =
    prerequisiteIds.length > 0
      ? await supabase.from("assignments").select("id, status").in("id", prerequisiteIds)
      : { data: [] };

  const prerequisiteStatusById = new Map((prerequisiteRows ?? []).map((r) => [r.id, r.status]));
  const hasUnmetDependency = new Set(
    (depRows ?? [])
      .filter((d) => prerequisiteStatusById.get(d.depends_on_assignment_id) !== "done")
      .map((d) => d.assignment_id),
  );

  return openRows.map((row) => ({
    eventId: row.event_id,
    eventName: row.events?.name ?? "—",
    id: row.id,
    title: row.title,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    isBlocked: row.status === "blocked" || hasUnmetDependency.has(row.id),
  }));
}
