import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { createAdminClient } from "@/lib/supabase/admin";

type Client = SupabaseClient<Database>;

export type SubmissionAnswerView = {
  fieldId: string;
  label: string;
  value: string | null;
  fileUrl: string | null;
};

export type SubmissionView = {
  id: string;
  submittedAt: string;
  contactName: string | null;
  contactEmail: string | null;
  answers: SubmissionAnswerView[];
};

// Shared by the admin and staff results routes: pass in whichever
// per-session client belongs to the caller and RLS does the authorization
// (admin_all vs staff_select_visible_submissions/can_staff_view_form) — this
// function makes no role decisions of its own. Signed URLs for file-type
// answers are minted with the service-role client, but only for file_refs
// that already survived the caller's RLS-scoped query above, so that step
// never re-decides who's allowed to see what.
export async function getFormSubmissions(
  supabase: Client,
  formId: string
): Promise<{ formName: string; submissions: SubmissionView[] } | null> {
  const { data: form } = await supabase
    .from("forms")
    .select("id, name, form_fields(id, label, position)")
    .eq("id", formId)
    .maybeSingle();

  if (!form) return null;

  const fieldLabelById = new Map(
    (form.form_fields ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((f) => [f.id, f.label])
  );

  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      "id, submitted_at, contacts(name, email), submission_answers(id, form_field_id, value, file_ref)"
    )
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false });

  const adminClient = createAdminClient();

  const submissionViews: SubmissionView[] = [];
  for (const s of submissions ?? []) {
    const answers: SubmissionAnswerView[] = [];
    for (const a of s.submission_answers ?? []) {
      let fileUrl: string | null = null;
      if (a.file_ref) {
        const { data: signed } = await adminClient.storage
          .from("form-submissions")
          .createSignedUrl(a.file_ref, 60 * 10);
        fileUrl = signed?.signedUrl ?? null;
      }
      answers.push({
        fieldId: a.form_field_id,
        label: fieldLabelById.get(a.form_field_id) ?? "(deleted field)",
        value: a.value,
        fileUrl,
      });
    }
    submissionViews.push({
      id: s.id,
      submittedAt: s.submitted_at,
      contactName: s.contacts?.name ?? null,
      contactEmail: s.contacts?.email ?? null,
      answers,
    });
  }

  return { formName: form.name, submissions: submissionViews };
}
