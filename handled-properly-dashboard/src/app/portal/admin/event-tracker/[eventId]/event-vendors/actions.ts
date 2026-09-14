"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sendEmail } from "@/lib/ses";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | null;

// The MultiSelectField behind this form lists every Contact (searchable by
// name) — there's no separate Vendor record to pick from, being a vendor is
// just being on an Event's event_vendors list. Replace-all, mirroring
// setRosterEntryCategories: the full list is submitted as one batch, not
// added/removed individually.
export async function setEventVendors(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const contactIds = formData.getAll("contact_ids") as string[];

  const supabase = await createSupabaseServerClient();

  const { error: deleteError } = await supabase.from("event_vendors").delete().eq("event_id", eventId);
  if (deleteError) return { error: deleteError.message };

  if (contactIds.length > 0) {
    const { error: insertError } = await supabase
      .from("event_vendors")
      .insert(contactIds.map((contactId) => ({ event_id: eventId, contact_id: contactId })));
    if (insertError) return { error: insertError.message };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

// Adds one existing Contact to this Event's Vendor List, for the "Add
// Vendor" control on the Vendor Details card -- unlike setEventVendors
// above (replace-all, from the plain roster-editing modal), this adds a
// single Contact without touching anyone already on the list. Upsert
// because re-adding a Contact who's already a vendor here is a no-op, not
// an error.
export async function addExistingVendor(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const contactId = String(formData.get("contact_id") ?? "").trim();
  if (!contactId) return { error: "Choose a contact to add." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("event_vendors")
    .upsert({ event_id: eventId, contact_id: contactId }, { onConflict: "event_id,contact_id" });
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

// The arrival/setup/parking/notes checklist the Vendor sees for this event
// (see docs/adr/0016-vendors-can-log-in.md), plus an optional location
// photo. Upsert on (event_id, contact_id) since a Vendor Event Detail is
// one row per Event Vendor List entry, created the first time the admin
// fills it in.
export async function upsertVendorEventDetails(
  eventId: string,
  contactId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const arrivalTime = String(formData.get("arrival_time") ?? "").trim();
  const arrivalLocation = String(formData.get("arrival_location") ?? "").trim();
  const setupTime = String(formData.get("setup_time") ?? "").trim();
  const setupLocation = String(formData.get("setup_location") ?? "").trim();
  const parkingInstructions = String(formData.get("parking_instructions") ?? "").trim();
  const adminNotes = String(formData.get("admin_notes") ?? "").trim();
  const accessExpiresAfterEvent = formData.get("access_expires_after_event") === "on";

  if (!arrivalTime) return { error: "Arrival time is required." };
  if (!arrivalLocation) return { error: "Arrival location is required." };

  const supabase = await createSupabaseServerClient();

  // A photo is optional and handled separately from the row upsert below --
  // uploaded first (same "upload before write" ordering as
  // documentation/actions.ts) so location_photo_path is only ever set to a
  // path that actually exists in storage. The old file is removed after a
  // successful upload, mirroring EventHeaderImageSettings' replace flow.
  const photo = formData.get("photo");
  let locationPhotoPath: string | undefined;
  if (photo instanceof File && photo.size > 0) {
    const { data: existing } = await supabase
      .from("vendor_event_details")
      .select("location_photo_path")
      .eq("event_id", eventId)
      .eq("contact_id", contactId)
      .maybeSingle();

    const adminClient = createAdminClient();
    const path = `${eventId}/${contactId}/${Date.now()}-${sanitizeStorageFilename(photo.name)}`;
    const { error: uploadError } = await adminClient.storage
      .from("vendor-location-photos")
      .upload(path, photo, { contentType: photo.type || undefined });
    if (uploadError) return { error: uploadError.message };

    if (existing?.location_photo_path) {
      await adminClient.storage.from("vendor-location-photos").remove([existing.location_photo_path]);
    }
    locationPhotoPath = path;
  }

  const { error } = await supabase.from("vendor_event_details").upsert(
    {
      event_id: eventId,
      contact_id: contactId,
      arrival_time: new Date(arrivalTime).toISOString(),
      arrival_location: arrivalLocation,
      setup_time: setupTime ? new Date(setupTime).toISOString() : null,
      setup_location: setupLocation || null,
      parking_instructions: parkingInstructions || null,
      admin_notes: adminNotes || null,
      access_expires_after_event: accessExpiresAfterEvent,
      ...(locationPhotoPath !== undefined ? { location_photo_path: locationPhotoPath } : {}),
    },
    { onConflict: "event_id,contact_id" }
  );
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

export async function removeVendorLocationPhoto(
  eventId: string,
  contactId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: details } = await supabase
    .from("vendor_event_details")
    .select("location_photo_path")
    .eq("event_id", eventId)
    .eq("contact_id", contactId)
    .maybeSingle();

  if (!details?.location_photo_path) return {};

  const { error } = await supabase
    .from("vendor_event_details")
    .update({ location_photo_path: null })
    .eq("event_id", eventId)
    .eq("contact_id", contactId);
  if (error) return { error: error.message };

  await createAdminClient().storage.from("vendor-location-photos").remove([details.location_photo_path]);

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Invites a Vendor (a Contact already on this Event's Vendor List) to the
// Vendor Portal for the first time. Mirrors inviteEventStaff exactly,
// except the Contact already exists (found via the Vendor List, not
// created here). A Contact can only ever get one vendors row -- if they
// already have one (e.g. invited on a previous Event), use
// restoreVendorAccess below instead of calling this again.
export async function inviteVendor(eventId: string, contactId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, name, email")
    .eq("id", contactId)
    .maybeSingle();
  if (contactError) return { error: contactError.message };
  if (!contact) return { error: "Contact not found." };

  const { data: existingVendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("contact_id", contactId)
    .maybeSingle();
  if (existingVendor) return { error: "This contact already has Vendor Portal access." };

  // Inviting requires the Auth Admin API, which only the service-role
  // client can call -- see inviteEventStaff for why generateLink (not
  // inviteUserByEmail) is used, and why the email is sent via SES ourselves.
  const adminClient = createAdminClient();
  const { data: invited, error: inviteError } = await adminClient.auth.admin.generateLink({
    type: "invite",
    email: contact.email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/portal/set-password`,
    },
  });
  if (inviteError) return { error: inviteError.message };

  const { error: vendorError } = await supabase.from("vendors").insert({
    contact_id: contactId,
    auth_user_id: invited.user.id,
    invite_status: "invited",
  });
  if (vendorError) return { error: vendorError.message };

  try {
    await sendEmail({
      to: contact.email,
      subject: "You've been invited to Handled Properly",
      bodyHtml: `
        <p>Hi ${contact.name},</p>
        <p>You've been invited to the Vendor Portal for an upcoming event.</p>
        <p><a href="${invited.properties.action_link}">Accept your invite and set a password</a></p>
      `,
    });
  } catch (err) {
    return {
      error: `Vendor invited, but the invite email failed to send: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Manual override, independent of Vendor Event Detail's
// access_expires_after_event auto-expiry -- lets the admin end a Vendor's
// portal access immediately, for any Event, without waiting on this one to
// complete.
export async function revokeVendorAccess(vendorId: string, eventId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vendors").update({ invite_status: "revoked" }).eq("id", vendorId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Attaches one or more Vendor Needs (items a vendor requested) to an
// existing Assignment, from the "add to assignment" flow in the Vendor's
// Requested Items modal — the sibling to createAssignment's own
// vendor_need_ids handling, for when the admin wants to fold selected items
// into an Assignment that already exists instead of creating a new one.
// Upsert + ignoreDuplicates since re-associating an item already linked to
// this Assignment is a no-op, not an error.
export async function linkVendorNeedsToAssignment(
  eventId: string,
  assignmentId: string,
  vendorNeedIds: string[]
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (vendorNeedIds.length === 0) return { error: "Select at least one item." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vendor_need_assignments").upsert(
    vendorNeedIds.map((vendorNeedId) => ({ vendor_need_id: vendorNeedId, assignment_id: assignmentId })),
    { onConflict: "vendor_need_id,assignment_id", ignoreDuplicates: true }
  );
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}

// Undoes revokeVendorAccess. A revoked Vendor still has a working auth
// account and password from before (revoking never touched auth_user_id or
// deleted the Supabase Auth user) -- so restoring just flips invite_status
// straight back to 'active', skipping the 'invited' state entirely, since
// there's no set-password step to redo and nothing to re-send.
export async function restoreVendorAccess(vendorId: string, eventId: string): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("vendors").update({ invite_status: "active" }).eq("id", vendorId);
  if (error) return { error: error.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
