import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { buildAssignmentTree } from "@/lib/data/assignment-tree";
import type { AssignmentData } from "./AssignmentCard";
import type { StaffOption } from "./NewAssignmentForm";

export async function getAssignmentsBoardData(eventId: string) {
  const supabase = await createSupabaseServerClient();

  const [{ data: rosterRows }, { data: assignmentRows }, { data: availableForms }] = await Promise.all([
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
    supabase.from("forms").select("id, name").is("target_type", null).order("name", { ascending: true }),
  ]);

  const assignmentIds = (assignmentRows ?? []).map((row) => row.id);
  const { data: assignmentForms } =
    assignmentIds.length > 0
      ? await supabase
          .from("forms")
          .select("id, name, target_id, staff_visible")
          .eq("target_type", "assignment")
          .in("target_id", assignmentIds)
      : { data: [] };

  const formsByAssignment = new Map<
    string,
    { id: string; name: string; staffVisible: boolean }[]
  >();
  for (const f of assignmentForms ?? []) {
    if (!f.target_id) continue;
    const list = formsByAssignment.get(f.target_id) ?? [];
    list.push({ id: f.id, name: f.name, staffVisible: f.staff_visible });
    formsByAssignment.set(f.target_id, list);
  }

  const rosterStaff: StaffOption[] = (rosterRows ?? [])
    .filter((r) => r.event_staff?.contacts)
    .map((r) => ({ id: r.event_staff!.id, name: r.event_staff!.contacts!.name }));

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
    forms: formsByAssignment.get(row.id) ?? [],
  }));

  const assignments: AssignmentData[] = buildAssignmentTree(flatAssignments);

  return {
    assignments,
    rosterStaff,
    availableForms: availableForms ?? [],
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  };
}
