"use server";

import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type CommentData = {
  id: string;
  body: string;
  authorName: string;
  isAdmin: boolean;
  createdAt: string;
};

type CommentRow = {
  id: string;
  body: string;
  created_at: string;
  author_admin_id: string | null;
  event_staff: { contacts: { name: string } | null } | null;
};

function toCommentData(row: CommentRow): CommentData {
  return {
    id: row.id,
    body: row.body,
    authorName: row.author_admin_id ? "Admin" : (row.event_staff?.contacts?.name ?? "Staff"),
    isAdmin: Boolean(row.author_admin_id),
    createdAt: row.created_at,
  };
}

// Comments are authored by either an admin or an event_staff member (see the
// dual-author shape on `messages`), and unlike Conversations, any Roster
// member for the assignment's Event can read and post — no separate
// opt-in-participant layer, matching how staff already see every Assignment
// for their events. The initial list always loads with the assignment (see
// getCommentsByAssignment in src/lib/data/assignment-comments.ts) — this
// action only needs to return the newly-posted comment for the caller to
// append locally.
export async function addAssignmentComment(
  assignmentId: string,
  body: string,
): Promise<{ comment: CommentData } | { error: string }> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Not authorized." };

  const trimmed = body.trim();
  if (!trimmed) return { error: "Comment can't be empty." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("assignment_comments")
    .insert({
      assignment_id: assignmentId,
      author_admin_id: actor.role === "admin" ? actor.adminId : null,
      author_event_staff_id: actor.role === "event_staff" ? actor.eventStaffId : null,
      body: trimmed,
    })
    .select("id, body, created_at, author_admin_id, event_staff:author_event_staff_id(contacts(name))")
    .single();

  if (error) return { error: error.message };

  return { comment: toCommentData(data) };
}
