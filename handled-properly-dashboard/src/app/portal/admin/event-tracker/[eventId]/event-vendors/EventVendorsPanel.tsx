import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import EventVendorsPanelClient from "./EventVendorsPanelClient";
import styles from "@/styles/admin-shared.module.css";

export default async function EventVendorsPanel({ eventId }: { eventId: string }) {
  const supabase = await createSupabaseServerClient();

  const [{ data: allVendors }, { data: currentVendorRows }] = await Promise.all([
    supabase.from("vendors").select("id, category, contacts(name)").order("created_at", { ascending: true }),
    supabase.from("event_vendors").select("vendor_id").eq("event_id", eventId),
  ]);

  const vendorOptions = (allVendors ?? [])
    .filter((v) => v.contacts)
    .map((v) => ({ id: v.id, label: `${v.contacts!.name} (${v.category})` }));

  const initialSelectedIds = (currentVendorRows ?? []).map((row) => row.vendor_id);

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Vendors</h2>
      <EventVendorsPanelClient
        eventId={eventId}
        vendorOptions={vendorOptions}
        initialSelectedIds={initialSelectedIds}
      />
    </div>
  );
}
