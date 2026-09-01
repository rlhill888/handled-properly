import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "@/styles/admin-shared.module.css";

export default async function ClientVendorsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  // RLS (client_select_event_vendors / client_select_own_vendors /
  // client_select_vendor_contacts) already limits this to this event's
  // Vendor list — no extra filter needed.
  const { data: eventVendors } = await supabase
    .from("event_vendors")
    .select("vendors(id, category, contacts(name, email, phone))")
    .eq("event_id", eventId);

  const vendors = (eventVendors ?? [])
    .map((row) => row.vendors)
    .filter((v): v is NonNullable<typeof v> => v !== null);

  return (
    <div className={styles.page}>
      <Link href={`/portal/client/events/${eventId}`} className={styles.backLink} aria-label={`Back to ${event.name}`}>
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Client · Vendors</span>
          <h1 className={styles.title}>{event.name}</h1>
        </div>
      </div>

      {vendors.length === 0 ? (
        <p className={styles.emptyState}>No vendors on this event yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {vendor.contacts?.name ?? "—"}
                </td>
                <td data-label="Category">
                  <span className={styles.pill}>{vendor.category}</span>
                </td>
                <td data-label="Email">{vendor.contacts?.email ?? "—"}</td>
                <td data-label="Phone">{vendor.contacts?.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
