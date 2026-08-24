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
