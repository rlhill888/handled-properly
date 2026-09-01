"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sendEmail } from "@/lib/ses";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | { success: string } | null;

// Images that came alongside an uploaded HTML export (e.g. a Canva export's
// "images/" folder) — hosted here, publicly, so the rewritten <img src>
// references keep working indefinitely for any recipient's email client,
// not just for the admin's own authenticated session. Keyed by original
// filename so the caller can rewrite the HTML's relative-path references
// (e.g. "images/photo1.png") by matching on the trailing filename alone.
export async function uploadEmailAssets(
  formData: FormData
): Promise<{ urls: Record<string, string> } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { urls: {} };

  const adminClient = createAdminClient();
  const prefix = `${Date.now()}-${crypto.randomUUID()}`;
  const urls: Record<string, string> = {};

  for (const file of files) {
    const path = `${prefix}/${sanitizeStorageFilename(file.name)}`;
    const { error: uploadError } = await adminClient.storage
      .from("email-assets")
      .upload(path, file, { contentType: file.type || undefined });
    if (uploadError) return { error: uploadError.message };

    const { data } = adminClient.storage.from("email-assets").getPublicUrl(path);
    urls[file.name] = data.publicUrl;
  }

  return { urls };
}

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
  const formIds = formData.getAll("form_ids").map(String).filter(Boolean);

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

  // The fill link(s) can only be built after the email_send exists (the URL
  // is /forms/fill/<formId>, so no email_send id is actually needed for it —
  // but the attachment rows below do need it), and must be folded into
  // body_html and persisted before we send, so the stored copy matches what
  // recipients actually received.
  let finalBodyHtml = bodyHtml;
  if (formIds.length > 0) {
    const { data: attachedForms, error: formsError } = await supabase
      .from("forms")
      .select("id, name")
      .in("id", formIds);
    if (formsError) return { error: formsError.message };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    const fillUrl = (formId: string) => `${siteUrl}/forms/fill/${formId}`;

    // A button already mapped to this form (via "Map Forms to Buttons" in
    // ComposeForm.tsx, see ai-actions.ts/ai-email-button-mapping.ts) has its
    // href set to this literal token. Any form without a mapped button —
    // mapping was never run, or no good button match was found — falls back
    // to a plain link appended to the email, so every attached form always
    // ends up reachable one way or another.
    for (const formId of formIds) {
      const token = `{{FORM_LINK_${formId}}}`;
      if (finalBodyHtml.includes(token)) {
        finalBodyHtml = finalBodyHtml.split(token).join(fillUrl(formId));
      } else {
        const form = attachedForms?.find((f) => f.id === formId);
        if (form) finalBodyHtml += `<p><a href="${fillUrl(formId)}">Fill out ${form.name}</a></p>`;
      }
    }

    const { error: attachError } = await supabase
      .from("email_send_forms")
      .insert(formIds.map((formId) => ({ email_send_id: emailSend.id, form_id: formId })));
    if (attachError) return { error: attachError.message };

    const { error: updateError } = await supabase
      .from("email_sends")
      .update({ body_html: finalBodyHtml })
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
