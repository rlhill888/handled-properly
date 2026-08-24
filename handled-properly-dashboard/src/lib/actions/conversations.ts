"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type ActionState = { error: string } | null;

// Path prefix differs between the admin and staff conversation routes, so
// callers pass the base path to revalidate rather than hardcoding one here.

export async function createConversation(
  eventId: string,
  basePath: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Not authorized." };

  const participantIds = formData.getAll("participant_ids").map(String);
  if (participantIds.length === 0) return { error: "Choose at least one participant." };

  const supabase = await createSupabaseServerClient();

  // See create_conversation() in the migrations: a plain insert can't work
  // for a staff caller (RLS can't read the row back before they're a
  // participant, and there's no staff insert policy on
  // conversation_participants at all) — the RPC handles authorization,
  // creates the conversation, and always includes the staff creator as a
  // participant alongside whoever else was picked.
  const { error } = await supabase.rpc("create_conversation", {
    target_event_id: eventId,
    participant_event_staff_ids: participantIds,
  });

  if (error) return { error: error.message };

  revalidatePath(basePath);
  return null;
}

export async function sendMessage(
  conversationId: string,
  basePath: string,
  body: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (!actor) return { error: "Not authorized." };
  if (!body.trim()) return { error: "Message can't be empty." };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_admin_id: actor.role === "admin" ? actor.adminId : null,
    sender_event_staff_id: actor.role === "event_staff" ? actor.eventStaffId : null,
    body: body.trim(),
  });

  if (error) return { error: error.message };

  revalidatePath(basePath);
  return {};
}
