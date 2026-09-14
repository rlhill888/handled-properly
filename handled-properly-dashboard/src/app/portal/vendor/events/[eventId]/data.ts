import "server-only";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { getVendorLocationPhotoUrl } from "@/lib/data/vendor-location-photo";

export type VendorEventDetail = {
  arrivalTime: string | null;
  arrivalLocation: string | null;
  setupTime: string | null;
  setupLocation: string | null;
  locationPhotoUrl: string | null;
  parkingInstructions: string | null;
};

// admin_notes is intentionally never selected here -- it's the admin's
// private note about this vendor, not part of what the Vendor sees.
export async function getVendorEventDetail(eventId: string): Promise<VendorEventDetail | null> {
  const actor = await getCurrentActor();
  if (actor?.role !== "vendor") return null;

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vendor_event_details")
    .select("arrival_time, arrival_location, setup_time, setup_location, location_photo_path, parking_instructions")
    .eq("event_id", eventId)
    .eq("contact_id", actor.contactId)
    .maybeSingle();

  if (!data) return null;

  const locationPhotoUrl = await getVendorLocationPhotoUrl(data.location_photo_path);

  return {
    arrivalTime: data.arrival_time,
    arrivalLocation: data.arrival_location,
    setupTime: data.setup_time,
    setupLocation: data.setup_location,
    locationPhotoUrl,
    parkingInstructions: data.parking_instructions,
  };
}

export type VendorNeed = { id: string; item: string };

export async function getVendorNeeds(eventId: string): Promise<VendorNeed[]> {
  const actor = await getCurrentActor();
  if (actor?.role !== "vendor") return [];

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("vendor_needs")
    .select("id, item")
    .eq("event_id", eventId)
    .eq("contact_id", actor.contactId)
    .order("created_at", { ascending: true });

  return data ?? [];
}
