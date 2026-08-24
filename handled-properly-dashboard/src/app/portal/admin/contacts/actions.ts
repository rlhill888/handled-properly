"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";

export type ActionState = { error: string } | null;

async function requireAdmin() {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return false;
  return true;
}

export async function createCategory(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Category name is required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").insert({ name });

  if (error) {
    if (error.code === "23505") return { error: "That category already exists." };
    return { error: error.message };
  }

  revalidatePath("/portal/admin/contacts");
  return null;
}

export async function deleteCategory(categoryId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("categories").delete().eq("id", categoryId);
  if (error) return { error: error.message };

  revalidatePath("/portal/admin/contacts");
  return {};
}

export async function createContact(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();
  const result = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in result) return { error: result.error };

  revalidatePath("/portal/admin/contacts");
  return null;
}

export async function setContactCategories(
  contactId: string,
  categoryIds: string[]
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase
    .from("contact_categories")
    .delete()
    .eq("contact_id", contactId);
  if (deleteError) return { error: deleteError.message };

  if (categoryIds.length > 0) {
    const { error: insertError } = await supabase
      .from("contact_categories")
      .insert(categoryIds.map((categoryId) => ({ contact_id: contactId, category_id: categoryId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/portal/admin/contacts");
  return {};
}

export async function addAttendance(
  contactId: string,
  eventId: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  if (!eventId) return { error: "Choose an event." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_attendance")
    .insert({ contact_id: contactId, event_id: eventId, source: "manual" });

  if (error) {
    if (error.code === "23505") return { error: "Already an attendee of that event." };
    return { error: error.message };
  }

  revalidatePath("/portal/admin/contacts");
  return {};
}
