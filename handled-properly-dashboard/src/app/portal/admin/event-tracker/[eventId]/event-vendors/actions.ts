"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type ActionState = { error: string } | null;

// Replace-all, mirroring setRosterEntryCategories — the full Event Vendor
// List for this Event is submitted as one batch, not added/removed
// individually.
export async function setEventVendors(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const vendorIds = formData.getAll("vendor_ids") as string[];

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase.from("event_vendors").delete().eq("event_id", eventId);
  if (deleteError) return { error: deleteError.message };

  if (vendorIds.length > 0) {
    const { error: insertError } = await supabase
      .from("event_vendors")
      .insert(vendorIds.map((vendorId) => ({ event_id: eventId, vendor_id: vendorId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}
