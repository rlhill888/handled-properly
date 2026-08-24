"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";

export type ActionState = { error: string } | null;

export async function createClientRecord(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const contact = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in contact) return { error: contact.error };

  const { error: clientError } = await supabase.from("clients").insert({
    contact_id: contact.id,
    company_name: companyName || null,
    notes: notes || null,
  });

  if (clientError) {
    if (clientError.code === "23505") {
      return { error: "This person is already a client." };
    }
    return { error: clientError.message };
  }

  revalidatePath("/portal/admin/clients");
  return null;
}

export async function updateClientRecord(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const clientId = String(formData.get("client_id") ?? "").trim();
  const contactId = String(formData.get("contact_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientId || !contactId) return { error: "Missing client." };
  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const { error: contactError } = await supabase
    .from("contacts")
    .update({ name, email: email.toLowerCase(), phone: phone || null })
    .eq("id", contactId);

  if (contactError) {
    if (contactError.code === "23505") {
      return { error: "Another contact already uses that email." };
    }
    return { error: contactError.message };
  }

  const { error: clientError } = await supabase
    .from("clients")
    .update({ company_name: companyName || null, notes: notes || null })
    .eq("id", clientId);

  if (clientError) return { error: clientError.message };

  revalidatePath("/portal/admin/clients");
  return null;
}
