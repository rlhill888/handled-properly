"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { FormBuilderSaveData } from "@/components/FormBuilder";

type SaveResult = { error?: string };

async function upsertFields(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  templateId: string,
  fields: FormBuilderSaveData["fields"]
): Promise<SaveResult> {
  // Fields keep their client-generated id stably across edits (rather than
  // delete-and-recreate) so a future Submission's form_field_id FK survives
  // a template edit instead of cascade-deleting when the field set changes.
  if (fields.length > 0) {
    const { error: upsertError } = await supabase.from("form_fields").upsert(
      fields.map((field, position) => ({
        id: field.id,
        form_template_id: templateId,
        position,
        label: field.label,
        description: field.description || null,
        field_type: field.type,
        required: field.required,
        styling: field.backgroundColor ? { backgroundColor: field.backgroundColor } : {},
      }))
    );
    if (upsertError) return { error: upsertError.message };
  }

  const { error: deleteError } = await supabase
    .from("form_fields")
    .delete()
    .eq("form_template_id", templateId)
    .not("id", "in", `(${fields.map((f) => f.id).join(",") || "00000000-0000-0000-0000-000000000000"})`);

  if (deleteError) return { error: deleteError.message };
  return {};
}

export async function createFormTemplate(data: FormBuilderSaveData): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: template, error: templateError } = await supabase
    .from("form_templates")
    .insert({ name: data.title, theme: { ...data.theme, description: data.description } })
    .select("id")
    .single();

  if (templateError) return { error: templateError.message };

  const fieldsResult = await upsertFields(supabase, template.id, data.fields);
  if (fieldsResult.error) return fieldsResult;

  revalidatePath("/portal/admin/form");
  redirect(`/portal/admin/form/${template.id}`);
}

export async function updateFormTemplate(
  templateId: string,
  data: FormBuilderSaveData
): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error: templateError } = await supabase
    .from("form_templates")
    .update({ name: data.title, theme: { ...data.theme, description: data.description } })
    .eq("id", templateId);

  if (templateError) return { error: templateError.message };

  return upsertFields(supabase, templateId, data.fields);
}

export async function deleteFormTemplate(templateId: string): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("form_templates").delete().eq("id", templateId);
  if (error) return { error: error.message };

  revalidatePath("/portal/admin/form");
  return {};
}
