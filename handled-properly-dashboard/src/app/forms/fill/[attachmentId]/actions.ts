"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { findOrCreateContact } from "@/lib/data/contacts";
import { getFillAttachment } from "./data";

export type ActionState = { error: string } | { success: true } | null;

export async function submitForm(
  attachmentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const attachment = await getFillAttachment(attachmentId);
  if (!attachment) return { error: "This form is no longer available." };

  const submitterName = String(formData.get("submitter_name") ?? "").trim();
  const submitterEmail = String(formData.get("submitter_email") ?? "").trim();
  if (!submitterName || !submitterEmail) return { error: "Your name and email are required." };

  for (const field of attachment.fields) {
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
    .insert({ form_attachment_id: attachment.id, contact_id: contactResult.id })
    .select("id")
    .single();
  if (submissionError) return { error: submissionError.message };

  // A submission through an Event's or Assignment's Form Attachment implies
  // attendance at the underlying Event; an Email-send attachment has no
  // Event to attend, so it only gets the Contact match/creation above.
  let eventId: string | null = null;
  if (attachment.targetType === "event") {
    eventId = attachment.targetId;
  } else if (attachment.targetType === "assignment") {
    const { data: assignment } = await supabase
      .from("assignments")
      .select("event_id")
      .eq("id", attachment.targetId)
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

  for (const field of attachment.fields) {
    if (field.fieldType === "file") {
      const file = formData.get(`field_${field.id}`);
      if (file instanceof File && file.size > 0) {
        const path = `${attachment.id}/${submission.id}/${field.id}-${file.name}`;
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
