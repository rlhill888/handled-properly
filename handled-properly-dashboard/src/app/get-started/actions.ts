"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/data/contacts";

export type ActionState = { error: string } | { success: true } | null;

// Public intake traffic has no anon RLS grants by design (see the RLS
// comment in the initial schema migration, and getFillForm's version of
// this note) — this is the trusted server route that writes on their
// behalf, using the service-role client.
export async function submitApplication(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const eventDate = String(formData.get("event_date") ?? "").trim();
  const guestCountRaw = String(formData.get("guest_count") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const budget = String(formData.get("budget") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email) return { error: "Your name and email are required." };
  if (!message) return { error: "Tell us a bit about your event." };

  const guestCount = guestCountRaw ? Number.parseInt(guestCountRaw, 10) : null;
  if (guestCountRaw && (guestCount === null || Number.isNaN(guestCount))) {
    return { error: "Guest count must be a number." };
  }

  const supabase = createAdminClient();

  const contact = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in contact) return { error: contact.error };

  const { error } = await supabase.from("client_applications").insert({
    contact_id: contact.id,
    name,
    email: email.toLowerCase(),
    phone: phone || null,
    company_name: companyName || null,
    event_date: eventDate || null,
    guest_count: guestCount,
    location: location || null,
    budget: budget || null,
    message,
  });

  if (error) return { error: error.message };

  return { success: true };
}
