"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type ActionState = { error: string } | null;

// The MultiSelectField behind this form lists every Contact (searchable by
// name) — there's no separate Vendor record to pick from, being a vendor is
// just being on an Event's event_vendors list. Replace-all, mirroring
// setRosterEntryCategories: the full list is submitted as one batch, not
// added/removed individually.
export async function setEventVendors(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const contactIds = formData.getAll("contact_ids") as string[];

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase.from("event_vendors").delete().eq("event_id", eventId);
  if (deleteError) return { error: deleteError.message };

  if (contactIds.length > 0) {
    const { error: insertError } = await supabase
      .from("event_vendors")
      .insert(contactIds.map((contactId) => ({ event_id: eventId, contact_id: contactId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}
