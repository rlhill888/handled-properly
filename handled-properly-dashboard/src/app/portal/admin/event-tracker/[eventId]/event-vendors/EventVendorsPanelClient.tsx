"use client";

import { useActionState } from "react";
import { setEventVendors, type ActionState } from "./actions";
import MultiSelectField from "@/components/portal/MultiSelectField";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function EventVendorsPanelClient({
  eventId,
  vendorOptions,
  initialSelectedIds,
}: {
  eventId: string;
  vendorOptions: { id: string; label: string }[];
  initialSelectedIds: string[];
}) {
  const boundAction = setEventVendors.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <MultiSelectField
        name="vendor_ids"
        label="Vendors visible to the client on this event"
        options={vendorOptions}
        initialSelectedIds={initialSelectedIds}
        placeholder="Add a vendor…"
        searchPlaceholder="Search vendors…"
      />

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Vendor List</SubmitButton>
      </div>
    </form>
  );
}
