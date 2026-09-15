import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type Client = SupabaseClient<Database>;

// Contact is the base identity for any real person (see
// docs/adr/0002-contact-as-base-identity.md) — Client, EventStaff, and
// Attendee all resolve to one Contact row per person rather than each
// holding their own copy of name/email/phone. Every entry point that
// creates a person (adding a client, inviting staff, a form submission)
// goes through this so nobody ends up duplicated by email.
export async function findOrCreateContact(
  supabase: Client,
  input: { name: string; email: string; phone?: string | null }
): Promise<{ id: string } | { error: string }> {
  const email = input.email.trim().toLowerCase();

  const { data: existing, error: findError } = await supabase
    .from("contacts")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (findError) return { error: findError.message };
  if (existing) return { id: existing.id };

  const { data: created, error: createError } = await supabase
    .from("contacts")
    .insert({ name: input.name.trim(), email, phone: input.phone?.trim() || null })
    .select("id")
    .single();

  if (createError) return { error: createError.message };
  return { id: created.id };
}

// Client and Vendor/Event Staff are mutually exclusive roles for a Contact —
// a Client is the person paying for the event, while Vendor and Event Staff
// are people working it, so one Contact holding both would blur who's on
// which side. Checked at every entry point that links an existing Contact
// to one of these roles (not just hidden client-side), mirroring how
// vendor_needs_due_date is enforced server-side rather than only in the UI.
export async function assertContactCanBecomeClient(
  supabase: Client,
  contactId: string
): Promise<{ error?: string }> {
  const [{ data: staff }, { data: vendorRow }] = await Promise.all([
    supabase.from("event_staff").select("id").eq("contact_id", contactId).maybeSingle(),
    supabase.from("event_vendors").select("event_id").eq("contact_id", contactId).limit(1).maybeSingle(),
  ]);
  if (staff) return { error: "This person is Event Staff and can't also be made a Client." };
  if (vendorRow) return { error: "This person is a Vendor and can't also be made a Client." };
  return {};
}

export async function assertContactCanBecomeVendorOrStaff(
  supabase: Client,
  contactId: string
): Promise<{ error?: string }> {
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("contact_id", contactId)
    .maybeSingle();
  if (client) return { error: "This person is a Client and can't also be made a Vendor or Event Staff." };
  return {};
}

// Batch form of assertContactCanBecomeVendorOrStaff, for the "replace the
// whole vendor list" flow (setEventVendors) where checking one contact at a
// time would mean one round trip per selection.
export async function assertContactsCanBecomeVendors(
  supabase: Client,
  contactIds: string[]
): Promise<{ error?: string }> {
  if (contactIds.length === 0) return {};

  const { data: clientContacts, error } = await supabase
    .from("clients")
    .select("contact_id, contacts(name)")
    .in("contact_id", contactIds);
  if (error) return { error: error.message };
  if (!clientContacts || clientContacts.length === 0) return {};

  const names = clientContacts.map((row) => row.contacts?.name).filter((name): name is string => Boolean(name));
  return {
    error: `${names.length > 0 ? names.join(", ") : "One or more selected contacts"} ${
      names.length === 1 ? "is" : "are"
    } a Client and can't also be made a Vendor.`,
  };
}
