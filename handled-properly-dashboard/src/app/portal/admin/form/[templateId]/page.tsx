import { notFound } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, type FormField, type FormFieldType } from "@/components/FormBuilder";
import EditFormTemplateClient from "./EditFormTemplateClient";

export default async function EditFormTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: template } = await supabase
    .from("form_templates")
    .select("id, name, theme")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) notFound();

  const { data: fieldRows } = await supabase
    .from("form_fields")
    .select("id, label, description, field_type, required, styling, position")
    .eq("form_template_id", templateId)
    .order("position", { ascending: true });

  const themeData = (template.theme as Record<string, unknown>) ?? {};
  const { description, ...themeRest } = themeData;

  const fields: FormField[] = (fieldRows ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    description: row.description ?? undefined,
    type: row.field_type as FormFieldType,
    required: row.required,
    backgroundColor: (row.styling as { backgroundColor?: string } | null)?.backgroundColor,
  }));

  return (
    <EditFormTemplateClient
      templateId={template.id}
      initialTitle={template.name}
      initialDescription={typeof description === "string" ? description : ""}
      initialTheme={{ ...DEFAULT_THEME, ...themeRest }}
      initialFields={fields}
    />
  );
}
