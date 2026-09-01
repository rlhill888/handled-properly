"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";
import { sendEmail } from "@/lib/ses";

export type ActionState = { error: string } | null;

export async function createClientRecord(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const contact = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in contact) return { error: contact.error };

  const { error: clientError } = await supabase.from("clients").insert({
    contact_id: contact.id,
    company_name: companyName || null,
    notes: notes || null,
  });

  if (clientError) {
    if (clientError.code === "23505") {
      return { error: "This person is already a client." };
    }
    return { error: clientError.message };
  }

  revalidatePath("/portal/admin/clients");
  return null;
}

export async function updateClientRecord(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const clientId = String(formData.get("client_id") ?? "").trim();
  const contactId = String(formData.get("contact_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const companyName = String(formData.get("company_name") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!clientId || !contactId) return { error: "Missing client." };
  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const { error: contactError } = await supabase
    .from("contacts")
    .update({ name, email: email.toLowerCase(), phone: phone || null })
    .eq("id", contactId);

  if (contactError) {
    if (contactError.code === "23505") {
      return { error: "Another contact already uses that email." };
    }
    return { error: contactError.message };
  }

  const { error: clientError } = await supabase
    .from("clients")
    .update({ company_name: companyName || null, notes: notes || null })
    .eq("id", clientId);

  if (clientError) return { error: clientError.message };

  revalidatePath("/portal/admin/clients");
  return null;
}

// Unlike inviteEventStaff, this UPDATEs an already-existing clients row
// (created earlier via createClientRecord or convertApplicationToClient)
// rather than INSERTing a fresh one — a Client record always exists before
// its portal login does.
export async function inviteClient(clientId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: client } = await supabase
    .from("clients")
    .select("auth_user_id, contacts(name, email)")
    .eq("id", clientId)
    .maybeSingle();

  if (!client) return { error: "Client not found." };
  if (!client.contacts) return { error: "This client has no contact record." };
  if (client.auth_user_id) return { error: "This client has already been invited." };

  const { name, email } = client.contacts;

  // Same generateLink + SES pattern as inviteEventStaff — see that file for
  // why generateLink rather than inviteUserByEmail.
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/portal/set-password`,
    },
  });

  if (inviteError) return { error: inviteError.message };

  const { error: updateError } = await supabase
    .from("clients")
    .update({ auth_user_id: invited.user.id, invite_status: "invited" })
    .eq("id", clientId);

  if (updateError) return { error: updateError.message };

  try {
    await sendEmail({
      to: email,
      subject: "You've been invited to the Handled Properly Client Portal",
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>You've been invited to your Client Portal.</p>
        <p><a href="${invited.properties.action_link}">Accept your invite and set a password</a></p>
      `,
    });
  } catch (err) {
    return {
      error: `Client invited, but the invite email failed to send: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  revalidatePath("/portal/admin/clients");
  return {};
}
