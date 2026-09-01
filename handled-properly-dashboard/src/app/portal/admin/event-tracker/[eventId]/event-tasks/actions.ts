"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { Database } from "@/lib/supabase/database.types";

export type ActionState = { error: string } | null;
type EventTaskStatus = Database["public"]["Enums"]["event_task_status"];

export async function createEventTask(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!title) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("event_tasks").insert({
    event_id: eventId,
    title,
    description: description || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

export async function addEventTaskUpdate(
  eventTaskId: string,
  eventId: string,
  body: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (!body.trim()) return { error: "Update can't be empty." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("event_task_updates").insert({
    event_task_id: eventTaskId,
    author_admin_id: actor.adminId,
    body: body.trim(),
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Always goes through the set_event_task_status RPC, never a plain
// .update() — that RPC is the one enforcement point for the Request
// Dependency gate (see the add_request_dependencies migration). There's no
// separate staff path for Event Tasks, so this is the only place the gate
// can live.
export async function setEventTaskStatus(
  eventTaskId: string,
  eventId: string,
  newStatus: EventTaskStatus
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_event_task_status", {
    target_event_task_id: eventTaskId,
    new_status: newStatus,
  });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Replace-all, mirroring setRosterEntryCategories.
export async function syncEventTaskDependencies(
  eventTaskId: string,
  eventId: string,
  requestIds: string[]
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from("request_dependencies")
    .delete()
    .eq("event_task_id", eventTaskId);
  if (deleteError) return { error: deleteError.message };

  if (requestIds.length > 0) {
    const { error: insertError } = await supabase
      .from("request_dependencies")
      .insert(requestIds.map((requestId) => ({ event_task_id: eventTaskId, request_id: requestId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
