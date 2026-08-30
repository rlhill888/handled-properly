import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FillField = {
  id: string;
  label: string;
  description: string | null;
  fieldType: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "file";
  required: boolean;
  options?: string[];
};

export type FillForm = {
  id: string;
  targetType: "event" | "assignment" | "email_send" | null;
  targetId: string | null;
  name: string;
  description: string;
  fields: FillField[];
};

// Public form-fill traffic has no anon RLS grants by design (see the RLS
// comment in the initial schema migration) — every read here goes through
// the service-role client, and this is the one place that's safe: the form
// id in the URL is itself the authorization (anyone who has the fill link
// is meant to be able to fill it).
export async function getFillForm(formId: string): Promise<FillForm | null> {
  const supabase = createAdminClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, name, theme, target_type, target_id")
    .eq("id", formId)
    .maybeSingle();

  if (!form) return null;

  const { data: fields } = await supabase
    .from("form_fields")
    .select("id, label, description, field_type, required, styling")
    .eq("form_id", form.id)
    .order("position", { ascending: true });

  const theme = form.theme as { description?: string } | null;

  return {
    id: form.id,
    targetType: form.target_type,
    targetId: form.target_id,
    name: form.name,
    description: theme?.description ?? "",
    fields: (fields ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      fieldType: f.field_type,
      required: f.required,
      options: (f.styling as { options?: string[] } | null)?.options,
    })),
  };
}
