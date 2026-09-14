import "server-only";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getVendorLocationPhotoUrl } from "@/lib/data/vendor-location-photo";

export type VendorEventDetailData = {
  contactId: string;
  name: string;
  email: string;
  phone: string | null;
  vendorId: string | null;
  inviteStatus: "invited" | "active" | "revoked" | null;
  arrivalTime: string | null;
  arrivalLocation: string | null;
  setupTime: string | null;
  setupLocation: string | null;
  locationPhotoUrl: string | null;
  parkingInstructions: string | null;
  adminNotes: string | null;
  accessExpiresAfterEvent: boolean;
  needs: { id: string; item: string; assignmentTitles: string[] }[];
};

// One row per Contact on this Event's Vendor List, joined with their Vendor
// Portal login status (if ever invited) and their Vendor Event Detail (if
// the admin has configured one yet). Scanning this list top to bottom is
// the admin's aggregated view of everything every vendor on the event
// needs -- no separate summary page.
export async function getEventVendorsWithDetails(eventId: string): Promise<VendorEventDetailData[]> {
  const supabase = await createSupabaseServerClient();

  const { data: eventVendorRows } = await supabase
    .from("event_vendors")
    .select("contact_id, contacts(id, name, email, phone)")
    .eq("event_id", eventId);

  const vendorContacts = (eventVendorRows ?? [])
    .map((row) => row.contacts)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  if (vendorContacts.length === 0) return [];

  const contactIds = vendorContacts.map((c) => c.id);

  const [{ data: detailsRows }, { data: vendorRows }, { data: needsRows }] = await Promise.all([
    supabase.from("vendor_event_details").select("*").eq("event_id", eventId),
    supabase.from("vendors").select("id, contact_id, invite_status").in("contact_id", contactIds),
    supabase
      .from("vendor_needs")
      .select("id, contact_id, item")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true }),
  ]);

  const needIds = (needsRows ?? []).map((row) => row.id);
  const { data: needAssignmentRows } =
    needIds.length > 0
      ? await supabase
          .from("vendor_need_assignments")
          .select("vendor_need_id, assignments(title)")
          .in("vendor_need_id", needIds)
      : { data: [] };

  const assignmentTitlesByNeed = new Map<string, string[]>();
  for (const row of needAssignmentRows ?? []) {
    if (!row.assignments) continue;
    const list = assignmentTitlesByNeed.get(row.vendor_need_id) ?? [];
    list.push(row.assignments.title);
    assignmentTitlesByNeed.set(row.vendor_need_id, list);
  }

  const detailsByContact = new Map((detailsRows ?? []).map((row) => [row.contact_id, row]));
  const vendorByContact = new Map((vendorRows ?? []).map((row) => [row.contact_id, row]));
  const needsByContact = new Map<string, { id: string; item: string; assignmentTitles: string[] }[]>();
  for (const row of needsRows ?? []) {
    const list = needsByContact.get(row.contact_id) ?? [];
    list.push({ id: row.id, item: row.item, assignmentTitles: assignmentTitlesByNeed.get(row.id) ?? [] });
    needsByContact.set(row.contact_id, list);
  }

  return Promise.all(
    vendorContacts.map(async (contact) => {
      const details = detailsByContact.get(contact.id) ?? null;
      const vendor = vendorByContact.get(contact.id) ?? null;
      const locationPhotoUrl = await getVendorLocationPhotoUrl(details?.location_photo_path ?? null);

      return {
        contactId: contact.id,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        vendorId: vendor?.id ?? null,
        inviteStatus: vendor?.invite_status ?? null,
        arrivalTime: details?.arrival_time ?? null,
        arrivalLocation: details?.arrival_location ?? null,
        setupTime: details?.setup_time ?? null,
        setupLocation: details?.setup_location ?? null,
        locationPhotoUrl,
        parkingInstructions: details?.parking_instructions ?? null,
        adminNotes: details?.admin_notes ?? null,
        accessExpiresAfterEvent: details?.access_expires_after_event ?? false,
        needs: needsByContact.get(contact.id) ?? [],
      };
    })
  );
}
