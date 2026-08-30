"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { FormBuilderSaveData } from "@/components/FormBuilder";
import type { Database } from "@/lib/supabase/database.types";

type TargetType = Database["public"]["Enums"]["form_target_type"];
type SaveResult = { error?: string };

export type FormTarget = { targetType: TargetType; targetId: string; basePath: string };

async function upsertFields(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  formId: string,
  fields: FormBuilderSaveData["fields"]
): Promise<SaveResult> {
  // Fields keep their client-generated id stably across edits (rather than
  // delete-and-recreate) so a future Submission's form_field_id FK survives
  // a form edit instead of cascade-deleting when the field set changes.
  if (fields.length > 0) {
    const { error: upsertError } = await supabase.from("form_fields").upsert(
      fields.map((field, position) => ({
        id: field.id,
        form_id: formId,
        position,
        label: field.label,
        description: field.description || null,
        field_type: field.type,
        required: field.required,
        styling: {
          ...(field.backgroundColor ? { backgroundColor: field.backgroundColor } : {}),
          ...(field.type === "select" && field.options?.length ? { options: field.options } : {}),
        },
      }))
    );
    if (upsertError) return { error: upsertError.message };
  }

  const { error: deleteError } = await supabase
    .from("form_fields")
    .delete()
    .eq("form_id", formId)
    .not("id", "in", `(${fields.map((f) => f.id).join(",") || "00000000-0000-0000-0000-000000000000"})`);

  if (deleteError) return { error: deleteError.message };
  return {};
}

export async function createForm(data: FormBuilderSaveData, target?: FormTarget): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: form, error: formError } = await supabase
    .from("forms")
    .insert({
      name: data.title,
      theme: { ...data.theme, description: data.description },
      target_type: target?.targetType ?? null,
      target_id: target?.targetId ?? null,
    })
    .select("id")
    .single();

  if (formError) return { error: formError.message };

  const fieldsResult = await upsertFields(supabase, form.id, data.fields);
  if (fieldsResult.error) return fieldsResult;

  if (target) {
    revalidatePath(target.basePath);
    redirect(target.basePath);
  }

  revalidatePath("/portal/admin/form");
  redirect(`/portal/admin/form/${form.id}`);
}

export async function updateForm(formId: string, data: FormBuilderSaveData): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error: formError } = await supabase
    .from("forms")
    .update({ name: data.title, theme: { ...data.theme, description: data.description } })
    .eq("id", formId);

  if (formError) return { error: formError.message };

  return upsertFields(supabase, formId, data.fields);
}

export async function deleteForm(formId: string, basePath = "/portal/admin/form"): Promise<SaveResult> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("forms").delete().eq("id", formId);
  if (error) return { error: error.message };

  revalidatePath(basePath);
  return {};
}
