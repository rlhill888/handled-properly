"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";

export type ActionState = { error: string } | null;

export async function createVendor(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };
  if (!category) return { error: "Category is required." };

  const supabase = await createSupabaseServerClient();

  const contact = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in contact) return { error: contact.error };

  const { error: vendorError } = await supabase.from("vendors").insert({
    contact_id: contact.id,
    category,
  });

  if (vendorError) {
    if (vendorError.code === "23505") {
      return { error: "This person is already a vendor." };
    }
    return { error: vendorError.message };
  }

  revalidatePath("/portal/admin/vendors");
  return null;
}
