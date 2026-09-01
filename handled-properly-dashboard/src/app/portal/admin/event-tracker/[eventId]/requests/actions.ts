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
  const requiresFile = formData.get("requires_file") === "on";
  // 'auto' only makes sense when a file is required — the DB CHECK
  // constraint (requests_auto_requires_file) enforces this too, but we
  // normalize here so a stray form value never trips it.
  const fulfillmentSetting = requiresFile && formData.get("fulfillment_setting") === "auto" ? "auto" : "manual_review";

  if (!title) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("requests").insert({
    event_id: eventId,
    title,
    description: description || null,
    due_date: dueDate || null,
    requires_file: requiresFile,
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
