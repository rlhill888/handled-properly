"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export type ActionState = { error: string } | null;

// Always creates a brand new Contact (unlike findOrCreateContact, used by
// every other person-creating entry point in this app) — an existing
// person is added as a vendor via the Contact search in the Edit Vendors
// modal instead (see setEventVendors), not by retyping their details here.
// Called from inside one Event's "Edit Vendors" modal, so the new Contact
// is put straight onto that Event's Vendor list too. There's no separate
// Vendor record — being a vendor is just being on an Event's
// event_vendors list.
export async function createVendor(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert({ name, email: email.toLowerCase(), phone: phone || null })
    .select("id")
    .single();
  if (contactError) return { error: contactError.message };

  const { error: linkError } = await supabase
    .from("event_vendors")
    .upsert({ event_id: eventId, contact_id: contact.id }, { onConflict: "event_id,contact_id" });
  if (linkError) return { error: linkError.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}
