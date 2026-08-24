"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";

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
  // client can call — the invite itself creates the auth.users row, so we
  // get a real auth_user_id back immediately rather than waiting for the
  // invite to be accepted.
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/portal/set-password` }
  );

  if (inviteError) return { error: inviteError.message };

  const { error: staffError } = await supabase.from("event_staff").insert({
    contact_id: contact.id,
    auth_user_id: invited.user.id,
    invite_status: "invited",
  });

  if (staffError) return { error: staffError.message };

  revalidatePath("/portal/admin/staff");
  return null;
}
