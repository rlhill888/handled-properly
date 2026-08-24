"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { Database } from "@/lib/supabase/database.types";

type TargetType = Database["public"]["Enums"]["form_attachment_target"];

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

export async function attachFormTemplate(
  targetType: TargetType,
  targetId: string,
  formTemplateId: string,
  basePath: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  if (!formTemplateId) return { error: "Choose a form template." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("form_attachments").insert({
    form_template_id: formTemplateId,
    target_type: targetType,
    target_id: targetId,
  });

  if (error) {
    if (error.code === "23505") return { error: "That template is already attached here." };
    return { error: error.message };
  }

  revalidatePath(basePath);
  return {};
}

export async function setAttachmentStaffVisible(
  attachmentId: string,
  staffVisible: boolean,
  basePath: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("form_attachments")
    .update({ staff_visible: staffVisible })
    .eq("id", attachmentId);

  if (error) return { error: error.message };

  revalidatePath(basePath);
  return {};
}

export async function removeFormAttachment(
  attachmentId: string,
  basePath: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("form_attachments").delete().eq("id", attachmentId);

  if (error) return { error: error.message };

  revalidatePath(basePath);
  return {};
}
