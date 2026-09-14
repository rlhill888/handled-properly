"use server";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { CommentData } from "@/lib/actions/assignment-comments";

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_admin_id: string | null;
  client: { contacts: { name: string } | null } | null;
};

function toCommentData(row: CommentRow): CommentData {
  return {
    id: row.id,
    body: row.body,
    authorName: row.author_admin_id ? "Admin" : (row.client?.contacts?.name ?? "Client"),
    isAdmin: Boolean(row.author_admin_id),
    createdAt: row.created_at,
  };
}

// Comments on a Request are authored by either the admin or the Request's
// Client — see request_comments' dual-author shape, mirroring
// assignment_comments. Unlike requests itself (which has no client write
// RLS policy — the Client's one write goes through the service-role
// client), request_comments has real client SELECT/INSERT policies scoped
// via is_client_for_event, so this runs on the session-scoped client and
// RLS does the authorization. The initial list always loads with the
// request (see getCommentsByRequest/getCommentsByRequestIds in
// src/lib/data/request-comments.ts) — this action only needs to return the
// newly-posted comment for the caller to append locally.
export async function addRequestComment(
  requestId: string,
  body: string,
): Promise<{ comment: CommentData } | { error: string }> {
  const actor = await getCurrentActor();
  if (!actor || (actor.role !== "admin" && actor.role !== "client")) return { error: "Not authorized." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("request_comments")
    .insert({
      request_id: requestId,
      author_admin_id: actor.role === "admin" ? actor.adminId : null,
      author_client_id: actor.role === "client" ? actor.clientId : null,
      body: trimmed,
    })
    .select("id, body, created_at, author_admin_id, client:author_client_id(contacts(name))")
    .single();

  if (error) return { error: error.message };

  return { comment: toCommentData(data) };
}
