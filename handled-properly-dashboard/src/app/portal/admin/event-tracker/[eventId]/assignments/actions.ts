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

// Replaces an assignment's full set of dependencies with `dependsOnIds`.
// Self-dependency is filtered defensively (the picker never offers the
// assignment itself, but this stays correct if that ever changes). Direct
// two-way cycles (and longer ones) aren't checked — a known, accepted scope
// limit, not an oversight.
async function syncAssignmentDependencies(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  assignmentId: string,
  dependsOnIds: string[]
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("assignment_dependencies")
    .delete()
    .eq("assignment_id", assignmentId);
  if (deleteError) return { error: deleteError.message };

  const filtered = dependsOnIds.filter((id) => id !== assignmentId);
  if (filtered.length > 0) {
    const { error: insertError } = await supabase.from("assignment_dependencies").insert(
      filtered.map((dependsOnId) => ({
        assignment_id: assignmentId,
        depends_on_assignment_id: dependsOnId,
      }))
    );
    if (insertError) return { error: insertError.message };
  }

  return {};
}

// Replaces an assignment's Event Task association with a single one (or
// clears it if eventTaskId is null) — the underlying event_task_assignments
// table is many-to-many, but from the Assignment's own create/edit form
// this is a single-select convenience, not the full picker the Event Task
// side gets. Re-validates the Event Task belongs to this same Event
// server-side, not just via the picker's options.
async function syncAssignmentEventTask(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string,
  assignmentId: string,
  eventTaskId: string | null
): Promise<{ error?: string }> {
  const { error: deleteError } = await supabase
    .from("event_task_assignments")
    .delete()
    .eq("assignment_id", assignmentId);
  if (deleteError) return { error: deleteError.message };

  if (eventTaskId) {
    const { data: task, error: fetchError } = await supabase
      .from("event_tasks")
      .select("id, event_id")
      .eq("id", eventTaskId)
      .maybeSingle();
    if (fetchError) return { error: fetchError.message };
    if (!task || task.event_id !== eventId) {
      return { error: "Event task must belong to the same event as this assignment." };
    }

    const { error: insertError } = await supabase
      .from("event_task_assignments")
      .insert({ event_task_id: eventTaskId, assignment_id: assignmentId });
    if (insertError) return { error: insertError.message };
  }

  return {};
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
  const dependsOnIds = formData.getAll("depends_on_ids").map(String);
  const eventTaskId = String(formData.get("event_task_id") ?? "") || null;

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

  const dependenciesResult = await syncAssignmentDependencies(supabase, assignment.id, dependsOnIds);
  if (dependenciesResult.error) return { error: dependenciesResult.error };

  const eventTaskResult = await syncAssignmentEventTask(supabase, eventId, assignment.id, eventTaskId);
  if (eventTaskResult.error) return { error: eventTaskResult.error };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
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
  const dependsOnIds = formData.getAll("depends_on_ids").map(String);
  const eventTaskId = String(formData.get("event_task_id") ?? "") || null;

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

  const dependenciesResult = await syncAssignmentDependencies(supabase, assignmentId, dependsOnIds);
  if (dependenciesResult.error) return { error: dependenciesResult.error };

  const eventTaskResult = await syncAssignmentEventTask(supabase, eventId, assignmentId, eventTaskId);
  if (eventTaskResult.error) return { error: eventTaskResult.error };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return null;
}

export async function updateAssignmentStatus(
  eventId: string,
  assignmentId: string,
  status: AssignmentStatus
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { error } = await supabase.from("assignments").update({ status }).eq("id", assignmentId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return {};
}

export async function updateAssignmentAssignees(
  eventId: string,
  assignmentId: string,
  staffIds: string[]
): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { error: deleteError } = await supabase
    .from("assignment_assignees")
    .delete()
    .eq("assignment_id", assignmentId);
  if (deleteError) return { error: deleteError.message };

  if (staffIds.length > 0) {
    const { error: insertError } = await supabase.from("assignment_assignees").insert(
      staffIds.map((eventStaffId) => ({
        assignment_id: assignmentId,
        event_staff_id: eventStaffId,
        assigned_via: "admin" as const,
      }))
    );
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return {};
}

export async function deleteAssignment(eventId: string, assignmentId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const activeCheck = await assertEventActive(supabase, eventId);
  if (activeCheck.error) return { error: activeCheck.error };

  const { error } = await supabase.from("assignments").delete().eq("id", assignmentId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  revalidatePath(`/portal/admin/event-tracker/${eventId}/assignments`);
  return {};
}
