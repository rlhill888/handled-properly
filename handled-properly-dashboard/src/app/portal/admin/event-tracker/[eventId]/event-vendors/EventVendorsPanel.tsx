import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import CollapsibleCard from "@/components/portal/CollapsibleCard";
import ModalButton from "@/components/portal/ModalButton";
import EventVendorsPanelClient from "./EventVendorsPanelClient";
import styles from "@/styles/admin-shared.module.css";

export default async function EventVendorsPanel({ eventId }: { eventId: string }) {
  const supabase = await createSupabaseServerClient();

  const [{ data: allContacts }, { data: eventVendorRows }] = await Promise.all([
    supabase.from("contacts").select("id, name").order("name", { ascending: true }),
    supabase
      .from("event_vendors")
      .select("contacts(id, name, email, phone)")
      .eq("event_id", eventId),
  ]);

  const currentVendors = (eventVendorRows ?? [])
    .map((row) => row.contacts)
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const contactOptions = (allContacts ?? []).map((c) => ({ id: c.id, label: c.name }));

  const initialSelectedIds = currentVendors.map((c) => c.id);

  return (
    <CollapsibleCard title="Vendors" badgeCount={currentVendors.length} defaultOpen={false}>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <ModalButton label="Edit" modalTitle="Edit Vendors" className={styles.secondaryButton}>
          <EventVendorsPanelClient
            eventId={eventId}
            contactOptions={contactOptions}
            initialSelectedIds={initialSelectedIds}
          />
        </ModalButton>
      </div>

      {currentVendors.length === 0 ? (
        <p className={styles.emptyState}>No vendors on this event yet.</p>
      ) : (
        <table className={`${styles.table} ${styles.cardRows}`}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {currentVendors.map((contact) => (
              <tr key={contact.id}>
                <td data-label="Name" className={styles.cardPrimaryCell}>
                  {contact.name}
                </td>
                <td data-label="Email">{contact.email}</td>
                <td data-label="Phone">{contact.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </CollapsibleCard>
  );
}
