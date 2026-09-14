import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type DependencyRef = {
  id: string;
  title: string;
  status: Database["public"]["Enums"]["assignment_status"];
};

type AssignmentLookup = {
  id: string;
  title: string;
  status: Database["public"]["Enums"]["assignment_status"];
};

// Comments-style batched fetch (see getCommentsByAssignment): dependencies
// always load with the assignment. One query for the whole event covers
// both directions — a row `assignment_id depends_on depends_on_assignment_id`
// is simultaneously "what assignment_id is waiting on" and "what
// depends_on_assignment_id blocks" — since dependencies only ever connect
// assignments within the same Event (enforced by only ever offering
// same-event assignments as options in the admin UI, not a DB constraint),
// every row's other side is already in `assignments`, so titles/status
// resolve from the same list already fetched for the board — no extra query.
export async function getAssignmentDependencies(
  supabase: SupabaseClient<Database>,
  assignments: AssignmentLookup[],
): Promise<{
  dependsOnByAssignment: Map<string, DependencyRef[]>;
  blocksByAssignment: Map<string, DependencyRef[]>;
}> {
  const dependsOnByAssignment = new Map<string, DependencyRef[]>();
  const blocksByAssignment = new Map<string, DependencyRef[]>();

  const assignmentIds = assignments.map((a) => a.id);
  if (assignmentIds.length === 0) return { dependsOnByAssignment, blocksByAssignment };

  const byId = new Map(assignments.map((a) => [a.id, a]));

  const { data } = await supabase
    .from("assignment_dependencies")
    .select("assignment_id, depends_on_assignment_id")
    .in("assignment_id", assignmentIds);

  for (const row of data ?? []) {
    const dependent = byId.get(row.assignment_id);
    const prerequisite = byId.get(row.depends_on_assignment_id);
    if (!dependent || !prerequisite) continue;

    const dependsOnList = dependsOnByAssignment.get(dependent.id) ?? [];
    dependsOnList.push({ id: prerequisite.id, title: prerequisite.title, status: prerequisite.status });
    dependsOnByAssignment.set(dependent.id, dependsOnList);

    const blocksList = blocksByAssignment.get(prerequisite.id) ?? [];
    blocksList.push({ id: dependent.id, title: dependent.title, status: dependent.status });
    blocksByAssignment.set(prerequisite.id, blocksList);
  }

  return { dependsOnByAssignment, blocksByAssignment };
}
