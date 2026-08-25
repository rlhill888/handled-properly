export type FlatAssignment<T> = T & { id: string; parentAssignmentId: string | null };
export type AssignmentNode<T> = T & { id: string; children: AssignmentNode<T>[] };

// Shared by the admin and staff assignment boards (#7/#10/#16) — turns the
// flat query result into a tree so a sub-assignment (parent_assignment_id
// set) nests under its parent instead of appearing as a sibling column
// card. Root order (top-level creation order) is preserved.
export function buildAssignmentTree<T>(rows: FlatAssignment<T>[]): AssignmentNode<T>[] {
  const byId = new Map<string, AssignmentNode<T>>();
  for (const row of rows) {
    byId.set(row.id, { ...row, children: [] });
  }

  const roots: AssignmentNode<T>[] = [];
  for (const row of rows) {
    const node = byId.get(row.id)!;
    if (row.parentAssignmentId && byId.has(row.parentAssignmentId)) {
      byId.get(row.parentAssignmentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
