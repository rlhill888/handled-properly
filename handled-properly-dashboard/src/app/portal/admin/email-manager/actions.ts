"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sendEmail } from "@/lib/ses";

export type ActionState = { error: string } | { success: string } | null;

export async function sendMassEmail(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("body_html") ?? "").trim();
  const categoryIds = formData.getAll("category_ids").map(String);
  const eventId = String(formData.get("event_id") ?? "");
  const eventFilterType = String(formData.get("event_filter_type") ?? ""); // "staff" | "attendees"
  const formTemplateId = String(formData.get("form_template_id") ?? "");

  if (!subject || !bodyHtml) return { error: "Subject and body are required." };

  const supabase = await createSupabaseServerClient();

  // Resolve recipients server-side from the current data, not whatever the
  // client last rendered — filters could have changed between page load
  // and submit. Category and event filters combine as an intersection
  // (AND), not a union — "VIP contacts who are also staff on Event X".
  let recipientQuery = supabase.from("contacts").select("id, name, email");

  if (categoryIds.length > 0) {
    const { data: matches, error: matchError } = await supabase
      .from("contact_categories")
      .select("contact_id")
      .in("category_id", categoryIds);

    if (matchError) return { error: matchError.message };

    const contactIds = [...new Set((matches ?? []).map((m) => m.contact_id))];
    if (contactIds.length === 0) return { error: "No contacts match the selected categories." };
    recipientQuery = recipientQuery.in("id", contactIds);
  }

  if (eventId && eventFilterType) {
    let eventContactIds: string[] = [];

    if (eventFilterType === "staff") {
      const { data: rosterRows, error: rosterError } = await supabase
        .from("roster_entries")
        .select("event_staff(contact_id)")
        .eq("event_id", eventId);
      if (rosterError) return { error: rosterError.message };
      eventContactIds = (rosterRows ?? [])
        .map((r) => r.event_staff?.contact_id)
        .filter((id): id is string => Boolean(id));
    } else if (eventFilterType === "attendees") {
      const { data: attendanceRows, error: attendanceError } = await supabase
        .from("event_attendance")
        .select("contact_id")
        .eq("event_id", eventId);
      if (attendanceError) return { error: attendanceError.message };
      eventContactIds = (attendanceRows ?? []).map((r) => r.contact_id);
    }

    if (eventContactIds.length === 0) return { error: "No contacts match the event filter." };
    recipientQuery = recipientQuery.in("id", eventContactIds);
  }

  const { data: recipients, error: recipientsError } = await recipientQuery;
  if (recipientsError) return { error: recipientsError.message };
  if (!recipients || recipients.length === 0) return { error: "No recipients to send to." };

  const { data: emailSend, error: sendError } = await supabase
    .from("email_sends")
    .insert({ subject, body_html: bodyHtml })
    .select("id")
    .single();

  if (sendError) return { error: sendError.message };

  // The attachment's target_id is the email_send's own id, so the
  // attachment row can only be created after the email_send exists —
  // and the fill link it produces must be folded into body_html and
  // persisted before we send, so the stored copy matches what recipients
  // actually received.
  let finalBodyHtml = bodyHtml;
  if (formTemplateId) {
    const { data: attachment, error: attachmentError } = await supabase
      .from("form_attachments")
      .insert({
        form_template_id: formTemplateId,
        target_type: "email_send",
        target_id: emailSend.id,
        staff_visible: false,
      })
      .select("id")
      .single();

    if (attachmentError) return { error: attachmentError.message };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    finalBodyHtml = `${bodyHtml}<p><a href="${siteUrl}/forms/fill/${attachment.id}">Fill out this form</a></p>`;

    const { error: updateError } = await supabase
      .from("email_sends")
      .update({ body_html: finalBodyHtml, form_attachment_id: attachment.id })
      .eq("id", emailSend.id);
    if (updateError) return { error: updateError.message };
  }

  const results = await Promise.allSettled(
    recipients.map((r) => sendEmail({ to: r.email, subject, bodyHtml: finalBodyHtml }))
  );

  const failures = results.filter((r) => r.status === "rejected").length;

  const { error: recipientsInsertError } = await supabase.from("email_recipients").insert(
    recipients.map((r) => ({ email_send_id: emailSend.id, contact_id: r.id }))
  );
  if (recipientsInsertError) return { error: recipientsInsertError.message };

  revalidatePath("/portal/admin/email-manager");

  if (failures > 0) {
    return {
      error: `Sent to ${recipients.length - failures} of ${recipients.length} recipients — ${failures} failed.`,
    };
  }

  return { success: `Sent to ${recipients.length} recipient${recipients.length === 1 ? "" : "s"}.` };
}
