"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | null;

export async function createEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const clientId = String(formData.get("client_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = String(formData.get("starts_at") ?? "");
  const endsAt = String(formData.get("ends_at") ?? "");
  const location = String(formData.get("location") ?? "").trim();

  if (!clientId || !name) return { error: "Client and event name are required." };
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
    return { error: "End date must be on or after the start date." };
  }

  const supabase = await createSupabaseServerClient();

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      client_id: clientId,
      name,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      location: location || null,
    })
    .select("id")
    .single();

  if (eventError) return { error: eventError.message };

  revalidatePath("/portal/admin/event-tracker");
  redirect(`/portal/admin/event-tracker/${event.id}`);
}

async function assertEventActive(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string
): Promise<{ error?: string }> {
  const { data: event, error } = await supabase
    .from("events")
    .select("status")
    .eq("id", eventId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!event) return { error: "Event not found." };
  if (event.status === "completed") {
    return { error: "This event is completed and its roster is locked." };
  }
  return {};
}

export async function addToRoster(eventId: string, eventStaffId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return activeCheck;

  const { error } = await supabase
    .from("roster_entries")
    .insert({ event_id: eventId, event_staff_id: eventStaffId });

  if (error) {
    if (error.code === "23505") return { error: "Already on this event's roster." };
    return { error: error.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

export async function removeFromRoster(
  eventId: string,
  eventStaffId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return activeCheck;

  const { error } = await supabase
    .from("roster_entries")
    .delete()
    .eq("event_id", eventId)
    .eq("event_staff_id", eventStaffId);

  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

export async function setStaffCanStartConversations(
  eventId: string,
  allowed: boolean
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("events")
    .update({ staff_can_start_conversations: allowed })
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/staff/events/${eventId}/conversations`);
  return {};
}

// Storage upload happens via the admin (service-role) client, mirroring the
// form-submissions bucket pattern — the "event-header-images" bucket is
// private with no storage.objects RLS policies, so every read (signed URL,
// see src/lib/data/event-header-image.ts) and write goes through this
// client rather than a per-session one. Admin-only, like every other event
// mutation in this file.
export async function setEventHeaderImage(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const file = formData.get("header_image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!file.type.startsWith("image/")) return { error: "Header image must be an image file." };

  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("header_image_path")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "Event not found." };

  const adminClient = createAdminClient();
  const path = `${eventId}/${Date.now()}-${sanitizeStorageFilename(file.name)}`;
  const { error: uploadError } = await adminClient.storage
    .from("event-header-images")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { error: uploadError.message };

  const { error: updateError } = await supabase
    .from("events")
    .update({ header_image_path: path })
    .eq("id", eventId);
  if (updateError) return { error: updateError.message };

  // Best-effort cleanup of the image being replaced — not worth failing the
  // whole request over an orphaned object in storage.
  if (event.header_image_path) {
    await adminClient.storage.from("event-header-images").remove([event.header_image_path]);
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/staff/events/${eventId}`);
  return null;
}

export async function removeEventHeaderImage(eventId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: event } = await supabase
    .from("events")
    .select("header_image_path")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) return { error: "Event not found." };

  const { error } = await supabase
    .from("events")
    .update({ header_image_path: null })
    .eq("id", eventId);
  if (error) return { error: error.message };

  if (event.header_image_path) {
    await createAdminClient().storage.from("event-header-images").remove([event.header_image_path]);
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/staff/events/${eventId}`);
  return {};
}

export async function markEventCompleted(eventId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("events")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", eventId);

  if (error) return { error: error.message };

  revalidatePath("/portal/admin/event-tracker");
  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
