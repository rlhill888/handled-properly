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
  const location = String(formData.get("location") ?? "").trim();
  const seriesMode = String(formData.get("series_mode") ?? "one_time");
  const existingSeriesId = String(formData.get("existing_series_id") ?? "");
  const newSeriesLabel = String(formData.get("new_series_label") ?? "").trim();

  if (!clientId || !name) return { error: "Client and event name are required." };

  const supabase = await createSupabaseServerClient();

  let seriesId: string | null = null;

  if (seriesMode === "existing_series") {
    if (!existingSeriesId) return { error: "Choose a series." };
    seriesId = existingSeriesId;
  } else if (seriesMode === "new_series") {
    if (!newSeriesLabel) return { error: "Name the new series." };
    const { data: series, error: seriesError } = await supabase
      .from("event_series")
      .insert({ client_id: clientId, label: newSeriesLabel })
      .select("id")
      .single();
    if (seriesError) return { error: seriesError.message };
    seriesId = series.id;
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      client_id: clientId,
      series_id: seriesId,
      name,
      starts_at: startsAt || null,
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

export async function createRosterCategory(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("roster_categories").insert({ event_id: eventId, name });

  if (error) {
    if (error.code === "23505") return { error: "That category already exists for this event." };
    return { error: error.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

export async function deleteRosterCategory(
  eventId: string,
  categoryId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("roster_categories").delete().eq("id", categoryId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

export async function setRosterEntryCategories(
  eventId: string,
  eventStaffId: string,
  categoryIds: string[]
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from("roster_entry_categories")
    .delete()
    .eq("event_staff_id", eventStaffId);
  if (deleteError) return { error: deleteError.message };

  if (categoryIds.length > 0) {
    const { error: insertError } = await supabase.from("roster_entry_categories").insert(
      categoryIds.map((categoryId) => ({
        event_staff_id: eventStaffId,
        category_id: categoryId,
      }))
    );
    if (insertError) return { error: insertError.message };
  }

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
