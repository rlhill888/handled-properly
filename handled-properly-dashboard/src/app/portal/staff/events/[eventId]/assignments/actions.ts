"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];

// Both RPCs enforce authorization themselves (roster membership, pickup
// setting) — see set_assignment_status/pickup_assignment in the initial
// schema migration — so there's nothing to check here beyond having a
// session at all, which the route/layout guards already require.

export async function staffSetStatus(
  eventId: string,
  assignmentId: string,
  status: AssignmentStatus
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_assignment_status", {
    target_assignment_id: assignmentId,
    new_status: status,
  });

  if (error) return { error: error.message };

  revalidatePath(`/portal/staff/events/${eventId}/assignments`);
  return {};
}

export async function staffPickupAssignment(
  eventId: string,
  assignmentId: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("pickup_assignment", {
    target_assignment_id: assignmentId,
  });

  if (error) return { error: error.message };

  revalidatePath(`/portal/staff/events/${eventId}/assignments`);
  return {};
}
