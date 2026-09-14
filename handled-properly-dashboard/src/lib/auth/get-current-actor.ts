import { createClient } from "@/lib/supabase/server";

export type CurrentActor =
  | { role: "admin"; adminId: string }
  | { role: "event_staff"; eventStaffId: string; contactId: string; inviteStatus: string }
  | { role: "client"; clientId: string; contactId: string; inviteStatus: string }
  | { role: "vendor"; vendorId: string; contactId: string; inviteStatus: string }
  | null;

// Looks up whether the signed-in Supabase Auth user is the Admin, an Event
// Staff member, a Client, or a Vendor. A user can only ever be one of the
// four (each role table is keyed by its own auth_user_id — see
// supabase/migrations/20260824103051_initial_schema.sql,
// 20260901100000_add_client_login.sql, and
// 20260913200000_add_vendor_login.sql).
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

  const { data: client } = await supabase
    .from("clients")
    .select("id, contact_id, invite_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (client) {
    return {
      role: "client",
      clientId: client.id,
      contactId: client.contact_id,
      inviteStatus: client.invite_status,
    };
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, contact_id, invite_status")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (vendor) {
    return {
      role: "vendor",
      vendorId: vendor.id,
      contactId: vendor.contact_id,
      inviteStatus: vendor.invite_status,
    };
  }

  return null;
}
