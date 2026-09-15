import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getEventVendorsWithDetails } from "./data";
import VendorDetailRow from "./VendorDetailRow";
import AddVendorForm from "./AddVendorForm";
import VendorNeedsDeadlineControl from "./VendorNeedsDeadlineControl";
import VendorRequestedItemsList from "./VendorRequestedItemsList";
import ModalButton from "@/components/portal/ModalButton";
import styles from "@/styles/admin-shared.module.css";

// The admin's single view of everything every vendor on this event needs:
// arrival/setup/parking/photo, plus their Vendor Portal login status.
// Internal-only (the Client never sees this — unlike the plain vendor
// roster in EventVendorsPanel, this carries the admin's private notes and
// invite management), so it lives on the Internal tab, not Client View. Can
// also add a vendor directly here (not just from the Vendors card's Edit
// Vendors modal) since configuring their details is usually the next thing
// the admin does right after adding them.
export default async function VendorDetailsPanel({ eventId }: { eventId: string }) {
  const supabase = await createSupabaseServerClient();

  const [vendors, { data: allContacts }, { data: event }, { data: assignmentRows }, { data: rosterRows }, { data: clientContactRows }] =
    await Promise.all([
      getEventVendorsWithDetails(eventId),
      supabase.from("contacts").select("id, name").order("name", { ascending: true }),
      supabase.from("events").select("vendor_needs_due_date").eq("id", eventId).maybeSingle(),
      supabase.from("assignments").select("id, title").eq("event_id", eventId).order("created_at", { ascending: true }),
      supabase.from("roster_entries").select("event_staff(id, contacts(name))").eq("event_id", eventId),
      supabase.from("clients").select("contact_id"),
    ]);

  const existingContactIds = new Set(vendors.map((v) => v.contactId));
  // Clients can't also be added as a Vendor (enforced server-side in
  // addExistingVendor too — this is just so the picker doesn't offer a
  // choice that would be rejected).
  const clientContactIds = new Set((clientContactRows ?? []).map((c) => c.contact_id));
  const contactOptions = (allContacts ?? [])
    .filter((c) => !existingContactIds.has(c.id) && !clientContactIds.has(c.id))
    .map((c) => ({ id: c.id, label: c.name }));

  const existingAssignments = (assignmentRows ?? []).map((a) => ({ id: a.id, title: a.title }));
  const rosterStaff = (rosterRows ?? [])
    .filter((r) => r.event_staff?.contacts)
    .map((r) => ({ id: r.event_staff!.id, name: r.event_staff!.contacts!.name }));

  return (
    <div className={styles.card}>
      <div className={styles.cardHeaderRow} style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            Vendor Details
          </h2>
          <ModalButton label="+" ariaLabel="Add Vendor" modalTitle="Add Vendor" className={styles.addButton}>
            <AddVendorForm eventId={eventId} contactOptions={contactOptions} />
          </ModalButton>
        </div>
        <VendorRequestedItemsList
          eventId={eventId}
          vendors={vendors}
          existingAssignments={existingAssignments}
          rosterStaff={rosterStaff}
        />
      </div>
      <p className={styles.description}>
        What each vendor needs for this event, and their Vendor Portal access.
      </p>
      <VendorNeedsDeadlineControl
        key={event?.vendor_needs_due_date ?? "none"}
        eventId={eventId}
        initialDueDate={event?.vendor_needs_due_date ?? null}
      />
      {vendors.length === 0 ? (
        <p className={styles.emptyState}>No vendors on this event yet.</p>
      ) : (
        <div className={styles.accordionList}>
          {vendors.map((vendor) => (
            <VendorDetailRow key={vendor.contactId} eventId={eventId} vendor={vendor} />
          ))}
        </div>
      )}
    </div>
  );
}
