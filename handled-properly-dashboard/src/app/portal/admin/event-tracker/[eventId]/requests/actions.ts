"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type ActionState = { error: string } | null;

export async function createRequest(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueDate = String(formData.get("due_date") ?? "").trim();
  const requestTypeRaw = String(formData.get("request_type") ?? "");
  const requestType = requestTypeRaw === "text" || requestTypeRaw === "checkbox" ? requestTypeRaw : "file";
  const fulfillmentSetting = formData.get("fulfillment_setting") === "auto" ? "auto" : "manual_review";

  if (!title) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("requests").insert({
    event_id: eventId,
    title,
    description: description || null,
    due_date: dueDate || null,
    request_type: requestType,
    fulfillment_setting: fulfillmentSetting,
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

export async function markRequestFulfilled(
  requestId: string,
  eventId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("requests")
    .update({ fulfilled_at: new Date().toISOString() })
    .eq("id", requestId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Reverses markRequestFulfilled — an admin override available regardless of
// Fulfillment Setting, since a Request that auto-fulfilled from the
// Client's action (an upload, a text submission, a checkbox) can still turn
// out to need another look. This only clears Fulfilled At; it doesn't touch
// the Client's submitted file/text/checked state, so reopening a Request
// doesn't erase what they already sent in.
export async function markRequestNotFulfilled(
  requestId: string,
  eventId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("requests").update({ fulfilled_at: null }).eq("id", requestId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
