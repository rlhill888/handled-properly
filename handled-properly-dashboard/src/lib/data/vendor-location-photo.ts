import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Mirrors getEventHeaderImageUrl's signed-URL pattern (see
// event-header-image.ts) -- used both on the admin's per-event vendor list
// (many photos, one per vendor) and the Vendor's own single-event detail
// page. A 1 hour TTL is plenty since it's only ever used as that page
// render's <img src>.
export async function getVendorLocationPhotoUrl(locationPhotoPath: string | null): Promise<string | null> {
  if (!locationPhotoPath) return null;
  const { data } = await createAdminClient()
    .storage.from("vendor-location-photos")
    .createSignedUrl(locationPhotoPath, 60 * 60);
  return data?.signedUrl ?? null;
}
