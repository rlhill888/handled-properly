import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type FillField = {
  id: string;
  label: string;
  description: string | null;
  fieldType: "text" | "email" | "tel" | "number" | "date" | "textarea" | "select" | "file";
  required: boolean;
};

export type FillAttachment = {
  id: string;
  targetType: "event" | "assignment" | "email_send";
  targetId: string;
  templateName: string;
  templateDescription: string;
  fields: FillField[];
};

// Public form-fill traffic has no anon RLS grants by design (see the RLS
// comment in the initial schema migration) — every read here goes through
// the service-role client, and this is the one place that's safe: the
// attachment id in the URL is itself the authorization (anyone who has the
// fill link is meant to be able to fill it).
export async function getFillAttachment(attachmentId: string): Promise<FillAttachment | null> {
  const supabase = createAdminClient();

  const { data: attachment } = await supabase
    .from("form_attachments")
    .select("id, target_type, target_id, form_templates(id, name, theme)")
    .eq("id", attachmentId)
    .maybeSingle();

  if (!attachment || !attachment.form_templates) return null;

  const { data: fields } = await supabase
    .from("form_fields")
    .select("id, label, description, field_type, required")
    .eq("form_template_id", attachment.form_templates.id)
    .order("position", { ascending: true });

  const theme = attachment.form_templates.theme as { description?: string } | null;

  return {
    id: attachment.id,
    targetType: attachment.target_type,
    targetId: attachment.target_id,
    templateName: attachment.form_templates.name,
    templateDescription: theme?.description ?? "",
    fields: (fields ?? []).map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      fieldType: f.field_type,
      required: f.required,
    })),
  };
}
