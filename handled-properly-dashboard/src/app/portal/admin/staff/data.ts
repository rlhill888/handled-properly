import "server-only";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type StaffMemberData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  inviteStatus: Database["public"]["Enums"]["staff_invite_status"];
  invitedAt: string;
  notes: string | null;
  // On at least one active event's roster right now — as opposed to
  // invite_status, which tracks portal-account lifecycle
  // (invited/active/revoked) and is unrelated to roster membership.
  isActive: boolean;
};

export async function getStaffPageData(): Promise<{
  staff: StaffMemberData[];
  error: { message: string } | null;
}> {
  const supabase = await createSupabaseServerClient();

  const [{ data: staffRows, error }, { data: rosterRows }] = await Promise.all([
    supabase
      .from("event_staff")
      .select("id, invite_status, invited_at, notes, contacts(name, email, phone)")
      .order("invited_at", { ascending: false }),
    supabase.from("roster_entries").select("event_staff_id, events(status)"),
  ]);

  const activeStaffIds = new Set(
    (rosterRows ?? [])
      .filter((row) => row.events?.status === "active")
      .map((row) => row.event_staff_id)
  );

  const staff: StaffMemberData[] = (staffRows ?? [])
    .filter((row) => row.contacts !== null)
    .map((row) => ({
      id: row.id,
      name: row.contacts!.name,
      email: row.contacts!.email,
      phone: row.contacts!.phone,
      inviteStatus: row.invite_status,
      invitedAt: row.invited_at,
      notes: row.notes,
      isActive: activeStaffIds.has(row.id),
    }));

  return { staff, error: error ? { message: error.message } : null };
}
