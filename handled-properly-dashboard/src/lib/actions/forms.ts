"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { Database } from "@/lib/supabase/database.types";

type TargetType = Database["public"]["Enums"]["form_target_type"];

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

// Only ever moves a currently-unassigned Form onto a target — a Form is
// never shared across several targets (see
// docs/adr/0008-forms-are-not-reusable-templates.md), so this isn't a
// reusable "attach" you can repeat elsewhere afterward.
export async function assignFormToTarget(
  formId: string,
  targetType: TargetType,
  targetId: string,
  basePath: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };
  if (!formId) return { error: "Choose a form." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("forms")
    .update({ target_type: targetType, target_id: targetId })
    .eq("id", formId)
    .is("target_type", null)
    .select("id");

  if (error) return { error: error.message };
  if (!data || data.length === 0) return { error: "That form is already in use elsewhere." };

  revalidatePath(basePath);
  return {};
}

export async function setFormStaffVisible(
  formId: string,
  staffVisible: boolean,
  basePath: string
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("forms").update({ staff_visible: staffVisible }).eq("id", formId);

  if (error) return { error: error.message };

  revalidatePath(basePath);
  return {};
}
