"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";
import { sendEmail } from "@/lib/ses";

export type ActionState = { error: string } | null;

export async function inviteEventStaff(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name || !email) return { error: "Name and email are required." };

  const supabase = await createSupabaseServerClient();

  const contact = await findOrCreateContact(supabase, { name, email, phone });
  if ("error" in contact) return { error: contact.error };

  const { data: existingStaff } = await supabase
    .from("event_staff")
    .select("id")
    .eq("contact_id", contact.id)
    .maybeSingle();

  if (existingStaff) return { error: "This person is already Event Staff." };

  // Inviting requires the Auth Admin API, which only the service-role
  // client can call. We use generateLink (not inviteUserByEmail) because
  // generateLink creates the auth.users row and hands back the same
  // GoTrue verify link Supabase would otherwise email itself, but does
  // NOT send any email — we deliver that link ourselves via SES so all
  // outbound mail goes through one provider.
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/portal/set-password`,
    },
  });

  if (inviteError) return { error: inviteError.message };

  const { error: staffError } = await supabase.from("event_staff").insert({
    contact_id: contact.id,
    auth_user_id: invited.user.id,
    invite_status: "invited",
  });

  if (staffError) return { error: staffError.message };

  try {
    await sendEmail({
      to: email,
      subject: "You've been invited to Handled Properly",
      bodyHtml: `
        <p>Hi ${name},</p>
        <p>You've been invited to join Handled Properly as Event Staff.</p>
        <p><a href="${invited.properties.action_link}">Accept your invite and set a password</a></p>
      `,
    });
  } catch (err) {
    return { error: `Staff record created, but the invite email failed to send: ${err instanceof Error ? err.message : String(err)}` };
  }

  revalidatePath("/portal/admin/staff");
  return null;
}

// Free-text notes on a staff member. "Tags" (see StaffList) are read-only —
// derived from roster_categories this person has ever been assigned across
// any event's roster, not a separately managed field, so there's no
// create/set action for them here.
export async function updateStaffNotes(
  eventStaffId: string,
  notes: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_staff")
    .update({ notes: notes.trim() || null })
    .eq("id", eventStaffId);
  if (error) return { error: error.message };

  revalidatePath("/portal/admin/staff");
  return {};
}
