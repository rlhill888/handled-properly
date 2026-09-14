import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CommentData } from "@/lib/actions/assignment-comments";

// Comments load with the assignment itself (part of the same board/tree
// fetch as Forms/assignees) rather than lazily on expand, so admin and
// staff always see them immediately — one batched query per page, grouped
// by assignment_id, mirroring the existing formsByAssignment/
// visibleFormsByAssignment pattern used for Forms on the same pages.
export async function getCommentsByAssignment(
  supabase: SupabaseClient<Database>,
  assignmentIds: string[],
): Promise<Map<string, CommentData[]>> {
  const commentsByAssignment = new Map<string, CommentData[]>();
  if (assignmentIds.length === 0) return commentsByAssignment;

  const { data } = await supabase
    .from("assignment_comments")
    .select(
      "assignment_id, id, body, created_at, author_admin_id, event_staff:author_event_staff_id(contacts(name))",
    )
    .in("assignment_id", assignmentIds)
    .order("created_at", { ascending: true });

  for (const row of data ?? []) {
    const list = commentsByAssignment.get(row.assignment_id) ?? [];
    list.push({
      id: row.id,
      body: row.body,
      authorName: row.author_admin_id ? "Admin" : (row.event_staff?.contacts?.name ?? "Staff"),
      isAdmin: Boolean(row.author_admin_id),
      createdAt: row.created_at,
    });
    commentsByAssignment.set(row.assignment_id, list);
  }

  return commentsByAssignment;
}
