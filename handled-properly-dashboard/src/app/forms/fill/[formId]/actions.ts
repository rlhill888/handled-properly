"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/data/contacts";
import { getFillForm } from "./data";

export type ActionState = { error: string } | { success: true } | null;

export async function submitForm(
  formId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const form = await getFillForm(formId);
  if (!form) return { error: "This form is no longer available." };

  const submitterName = String(formData.get("submitter_name") ?? "").trim();
  const submitterEmail = String(formData.get("submitter_email") ?? "").trim();
  if (!submitterName || !submitterEmail) return { error: "Your name and email are required." };

  for (const field of form.fields) {
    if (!field.required) continue;
    if (field.fieldType === "file") {
      const file = formData.get(`field_${field.id}`);
      if (!(file instanceof File) || file.size === 0) return { error: `"${field.label}" is required.` };
    } else {
      const value = String(formData.get(`field_${field.id}`) ?? "").trim();
      if (!value) return { error: `"${field.label}" is required.` };
    }
  }

  const supabase = createAdminClient();

  const contactResult = await findOrCreateContact(supabase, {
    name: submitterName,
    email: submitterEmail,
  });
  if ("error" in contactResult) return { error: contactResult.error };

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert({ form_id: form.id, contact_id: contactResult.id })
    .select("id")
    .single();
  if (submissionError) return { error: submissionError.message };

  // A submission through a Form scoped to an Event or Assignment implies
  // attendance at the underlying Event; a Form scoped to an Email Send (or
  // a standalone Form) has no Event to attend, so it only gets the Contact
  // match/creation above.
  let eventId: string | null = null;
  if (form.targetType === "event") {
    eventId = form.targetId;
  } else if (form.targetType === "assignment" && form.targetId) {
    const { data: assignment } = await supabase
      .from("assignments")
      .select("event_id")
      .eq("id", form.targetId)
      .maybeSingle();
    eventId = assignment?.event_id ?? null;
  }

  if (eventId) {
    const { error: attendanceError } = await supabase
      .from("event_attendance")
      .upsert(
        { event_id: eventId, contact_id: contactResult.id, source: "form_submission" },
        { onConflict: "event_id,contact_id", ignoreDuplicates: true }
      );
    if (attendanceError) return { error: attendanceError.message };
  }

  const answers: {
    submission_id: string;
    form_field_id: string;
    value: string | null;
    file_ref: string | null;
  }[] = [];

  for (const field of form.fields) {
    if (field.fieldType === "file") {
      const file = formData.get(`field_${field.id}`);
      if (file instanceof File && file.size > 0) {
        const path = `${form.id}/${submission.id}/${field.id}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("form-submissions")
          .upload(path, file, { contentType: file.type || undefined });
        if (uploadError) return { error: uploadError.message };
        answers.push({ submission_id: submission.id, form_field_id: field.id, value: null, file_ref: path });
      } else {
        answers.push({ submission_id: submission.id, form_field_id: field.id, value: null, file_ref: null });
      }
    } else {
      const value = String(formData.get(`field_${field.id}`) ?? "").trim();
      answers.push({
        submission_id: submission.id,
        form_field_id: field.id,
        value: value || null,
        file_ref: null,
      });
    }
  }

  if (answers.length > 0) {
    const { error: answersError } = await supabase.from("submission_answers").insert(answers);
    if (answersError) return { error: answersError.message };
  }

  return { success: true };
}
