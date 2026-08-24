"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

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
