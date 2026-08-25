"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import type { Database } from "@/lib/supabase/database.types";

type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];
type AssignmentPriority = Database["public"]["Enums"]["assignment_priority"];
type PickupSetting = Database["public"]["Enums"]["pickup_setting"];

export type ActionState = { error: string } | null;

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

async function assertEventActive(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string
): Promise<{ error?: string }> {
  const { data: event, error } = await supabase
    .from("events")
    .select("status")
    .eq("id", eventId)
    .maybeSingle();

  if (error) return { error: error.message };
  if (!event) return { error: "Event not found." };
  if (event.status === "completed") {
    return { error: "This event is completed; its assignments are locked." };
  }
  return {};
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export async function createAssignment(
  eventId: string,
  parentAssignmentId: string | null,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const dueDate = String(formData.get("due_date") ?? "");
  const priority = String(formData.get("priority") ?? "medium") as AssignmentPriority;
  const pickupSetting = String(formData.get("pickup_setting") ?? "admin_only") as PickupSetting;
  const assigneeIds = formData.getAll("assignee_ids").map(String);

  if (!title) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { data: assignment, error } = await supabase
    .from("assignments")
    .insert({
      event_id: eventId,
      parent_assignment_id: parentAssignmentId,
      title,
      description: description || null,
      tags,
      due_date: dueDate || null,
      priority,
      pickup_setting: pickupSetting,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await supabase.from("assignment_assignees").insert(
      assigneeIds.map((eventStaffId) => ({
        assignment_id: assignment.id,
        event_staff_id: eventStaffId,
        assigned_via: "admin" as const,
      }))
    );
    if (assigneeError) return { error: assigneeError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return null;
}

export async function updateAssignment(
  eventId: string,
  assignmentId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = parseTags(String(formData.get("tags") ?? ""));
  const dueDate = String(formData.get("due_date") ?? "");
  const priority = String(formData.get("priority") ?? "medium") as AssignmentPriority;
  const status = String(formData.get("status") ?? "ready") as AssignmentStatus;
  const pickupSetting = String(formData.get("pickup_setting") ?? "admin_only") as PickupSetting;
  const assigneeIds = formData.getAll("assignee_ids").map(String);

  if (!title) return { error: "Title is required." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { error } = await supabase
    .from("assignments")
    .update({
      title,
      description: description || null,
      tags,
      due_date: dueDate || null,
      priority,
      status,
      pickup_setting: pickupSetting,
    })
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  const { error: deleteAssigneesError } = await supabase
    .from("assignment_assignees")
    .delete()
    .eq("assignment_id", assignmentId);
  if (deleteAssigneesError) return { error: deleteAssigneesError.message };

  if (assigneeIds.length > 0) {
    const { error: assigneeError } = await supabase.from("assignment_assignees").insert(
      assigneeIds.map((eventStaffId) => ({
        assignment_id: assignmentId,
        event_staff_id: eventStaffId,
        assigned_via: "admin" as const,
      }))
    );
    if (assigneeError) return { error: assigneeError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return null;
}

export async function deleteAssignment(eventId: string, assignmentId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return {};
}
