import { notFound } from "next/navigation";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { DEFAULT_THEME, type FormField, type FormFieldType } from "@/components/FormBuilder";
import EditFormClient from "./EditFormClient";

const TARGET_LABEL = {
  event: "Event",
  assignment: "Assignment",
  email_send: "Email Send",
} as const;

export default async function EditFormPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: form } = await supabase
    .from("forms")
    .select("id, name, theme, target_type")
    .eq("id", formId)
    .maybeSingle();

  if (!form) notFound();

  const { data: fieldRows } = await supabase
    .from("form_fields")
    .select("id, label, description, field_type, required, styling, position")
    .eq("form_id", formId)
    .order("position", { ascending: true });

  const themeData = (form.theme as Record<string, unknown>) ?? {};
  const { description, ...themeRest } = themeData;

  const fields: FormField[] = (fieldRows ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    description: row.description ?? undefined,
    type: row.field_type as FormFieldType,
    required: row.required,
    backgroundColor: (row.styling as { backgroundColor?: string } | null)?.backgroundColor,
    options: (row.styling as { options?: string[] } | null)?.options,
  }));

  return (
    <EditFormClient
      formId={form.id}
      initialTitle={form.name}
      initialDescription={typeof description === "string" ? description : ""}
      initialTheme={{ ...DEFAULT_THEME, ...themeRest }}
      initialFields={fields}
      fillUrl={`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/forms/fill/${form.id}`}
      scopeLabel={form.target_type ? TARGET_LABEL[form.target_type] : "Standalone"}
    />
  );
}
