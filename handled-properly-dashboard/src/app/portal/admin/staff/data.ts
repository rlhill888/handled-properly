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
  // Every distinct roster_categories name this person has ever been
  // assigned, across every event's roster they've ever been on — not a
  // separately managed field, just a rollup of the existing per-event
  // roster-category assignments (RosterManager.tsx).
  categoryNames: string[];
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

  const [{ data: staffRows, error }, { data: categoryLinkRows }, { data: rosterRows }] =
    await Promise.all([
      supabase
        .from("event_staff")
        .select("id, invite_status, invited_at, notes, contacts(name, email, phone)")
        .order("invited_at", { ascending: false }),
      // Every roster-category assignment this person has ever had, on any
      // event — no event_id filter, unlike the per-event views elsewhere.
      supabase.from("roster_entry_categories").select("event_staff_id, roster_categories(name)"),
      supabase.from("roster_entries").select("event_staff_id, events(status)"),
    ]);

  const categoryNamesByStaff = new Map<string, Set<string>>();
  for (const link of categoryLinkRows ?? []) {
    if (!link.roster_categories) continue;
    const set = categoryNamesByStaff.get(link.event_staff_id) ?? new Set<string>();
    set.add(link.roster_categories.name);
    categoryNamesByStaff.set(link.event_staff_id, set);
  }

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
      categoryNames: Array.from(categoryNamesByStaff.get(row.id) ?? []).sort(),
      isActive: activeStaffIds.has(row.id),
    }));

  return { staff, error: error ? { message: error.message } : null };
}
