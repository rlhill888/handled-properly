export type FlatAssignment<T> = T & { id: string; parentAssignmentId: string | null };
export type AssignmentNode<T> = T & { id: string; subtasks: AssignmentNode<T>[] };

// Shared by the admin and staff assignment boards — turns the flat query
// result into a tree so a Subtask (parent_assignment_id set) nests under
// its parent instead of appearing as a sibling column card. Root order
// (top-level creation order) is preserved.
export function buildAssignmentTree<T>(rows: FlatAssignment<T>[]): AssignmentNode<T>[] {
  const byId = new Map<string, AssignmentNode<T>>();
  for (const row of rows) {
    byId.set(row.id, { ...row, subtasks: [] });
  }

  const roots: AssignmentNode<T>[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentAssignmentId && byId.has(row.parentAssignmentId)) {
      byId.get(row.parentAssignmentId)!.subtasks.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
