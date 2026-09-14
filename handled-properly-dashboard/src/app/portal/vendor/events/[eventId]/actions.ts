"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

// A Vendor Need is Vendor-authored (the reverse of Vendor Event Detail,
// which is admin-authored) — one row per item, so removing a single
// fulfilled item doesn't require retyping the rest. Takes the raw item text
// directly (rather than a bound useActionState/FormData action) so the
// caller can fire several of these concurrently — one per in-flight
// optimistic list entry — instead of serializing through one shared action
// state.
export async function addVendorNeed(eventId: string, rawItem: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "vendor") return { error: "Not authorized." };

  const item = rawItem.trim();
  if (!item) return { error: "Describe what you need." };

  const supabase = await createSupabaseServerClient();

  // The admin's optional cutoff on this Event (events.vendor_needs_due_date)
  // — enforced here, not just hidden client-side, since the client-side
  // check is only a courtesy.
  const { data: event } = await supabase
    .from("events")
    .select("vendor_needs_due_date")
    .eq("id", eventId)
    .maybeSingle();
  if (event?.vendor_needs_due_date && new Date(event.vendor_needs_due_date) < new Date()) {
    return { error: "The deadline to request items for this event has passed." };
  }

  const { error } = await supabase
    .from("vendor_needs")
    .insert({ event_id: eventId, contact_id: actor.contactId, item });
  if (error) return { error: error.message };

  revalidatePath(`/portal/vendor/events/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

export async function removeVendorNeed(needId: string, eventId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "vendor") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("vendor_needs")
    .delete()
    .eq("id", needId)
    .eq("contact_id", actor.contactId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/vendor/events/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
