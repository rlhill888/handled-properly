"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

export async function saveEmailTemplate(
  name: string,
  subject: string,
  bodyHtml: string,
  source: "manual" | "ai_draft" = "manual"
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  if (!name.trim()) return { error: "Name the template before saving." };
  if (!subject.trim() || !bodyHtml.trim()) return { error: "Subject and body are required." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("email_templates")
    .insert({ name: name.trim(), subject, body_html: bodyHtml, source });

  if (error) return { error: error.message };

  revalidatePath("/portal/admin/email-manager");
  return {};
}

export async function deleteEmailTemplate(templateId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("email_templates").delete().eq("id", templateId);

  if (error) return { error: error.message };

  revalidatePath("/portal/admin/email-manager");
  return {};
}
