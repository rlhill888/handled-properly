"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { setEventVendors, type ActionState } from "./actions";
import MultiSelectField from "@/components/portal/MultiSelectField";
import NewVendorForm from "@/components/portal/NewVendorForm";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function EventVendorsPanelClient({
  eventId,
  contactOptions,
  initialSelectedIds,
}: {
  eventId: string;
  contactOptions: { id: string; label: string }[];
  initialSelectedIds: string[];
}) {
  const router = useRouter();
  const boundAction = setEventVendors.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);

  return (
    <div className={styles.form}>
      <form action={formAction} className={styles.form}>
        {state?.error && <p className={styles.error}>{state.error}</p>}

        <MultiSelectField
          name="contact_ids"
          label="Vendors visible to the client on this event"
          helperText="search any contact by name to add them as a vendor"
          options={contactOptions}
          initialSelectedIds={initialSelectedIds}
          placeholder="Search contacts by name…"
          searchPlaceholder="Search contacts…"
        />

        <div className={styles.actions}>
          <SubmitButton pendingLabel="Saving…">Save Vendor List</SubmitButton>
        </div>
      </form>

      <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <h3 className={styles.cardTitle}>Add a New Vendor</h3>
        <p className={styles.description} style={{ marginBottom: 16 }}>
          Creates a brand new contact and adds them to this event as a vendor.
        </p>
        <NewVendorForm eventId={eventId} onCreated={() => router.refresh()} />
      </div>
    </div>
  );
}
