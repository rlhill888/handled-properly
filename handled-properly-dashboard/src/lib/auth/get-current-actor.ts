import { createClient } from "@/lib/supabase/server";

export type CurrentActor =
  | { role: "admin"; adminId: string }
  | { role: "event_staff"; eventStaffId: string; contactId: string; inviteStatus: string }
  | null;

// Looks up whether the signed-in Supabase Auth user is the Admin or an
// Event Staff member. A user can only ever be one or the other (an
// event_staff row keyed by auth_user_id, an admins row keyed by
// auth_user_id — see supabase/migrations/20260824103051_initial_schema.sql).
export async function getCurrentActor(): Promise<CurrentActor> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (admin) return { role: "admin", adminId: admin.id };

  const { data: staff } = await supabase
    .from("event_staff")
    .select("id, contact_id, invite_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (staff) {
    return {
      role: "event_staff",
      eventStaffId: staff.id,
      contactId: staff.contact_id,
      inviteStatus: staff.invite_status,
    };
  }

  return null;
}
