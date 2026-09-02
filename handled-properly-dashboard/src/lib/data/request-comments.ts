import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { CommentData } from "@/lib/actions/assignment-comments";

// Comments load with the request itself (part of the same fetch as the rest
// of a Request's fields) rather than lazily on expand, mirroring
// getCommentsByAssignment — one batched query per page, grouped by
// request_id.
export async function getCommentsByRequestIds(
  supabase: SupabaseClient<Database>,
  requestIds: string[],
): Promise<Map<string, CommentData[]>> {
  const commentsByRequest = new Map<string, CommentData[]>();
  if (requestIds.length === 0) return commentsByRequest;

  const { data } = await supabase
    .from("request_comments")
    .select("request_id, id, body, created_at, author_admin_id, client:author_client_id(contacts(name))")
    .in("request_id", requestIds)
    .order("created_at", { ascending: true });

  for (const row of data ?? []) {
    const list = commentsByRequest.get(row.request_id) ?? [];
    list.push({
      id: row.id,
      body: row.body,
      authorName: row.author_admin_id ? "Admin" : (row.client?.contacts?.name ?? "Client"),
      isAdmin: Boolean(row.author_admin_id),
      createdAt: row.created_at,
    });
    commentsByRequest.set(row.request_id, list);
  }

  return commentsByRequest;
}
