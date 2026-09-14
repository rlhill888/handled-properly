"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addExistingVendor, type ActionState } from "./actions";
import SingleSelectField from "@/components/portal/SingleSelectField";
import NewVendorForm from "@/components/portal/NewVendorForm";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

// Lets the admin add a vendor to this event right from the Vendor Details
// card, instead of only from the plain roster-editing modal on the Vendors
// card (Client View tab) — the same two ways in, existing contact search or
// brand-new contact, just single-add rather than replace-all.
export default function AddVendorForm({
  eventId,
  contactOptions,
}: {
  eventId: string;
  contactOptions: { id: string; label: string }[];
}) {
  const router = useRouter();
  const boundAction = addExistingVendor.bind(null, eventId);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);
  const [fieldsResetKey, setFieldsResetKey] = useState(0);
  const [selectedContactId, setSelectedContactId] = useState("");

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      setFieldsResetKey((k) => k + 1);
      setSelectedContactId("");
      router.refresh();
    }
    previousState.current = state;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className={styles.form}>
      <form ref={formRef} action={formAction} className={styles.form}>
        {state?.error && <p className={styles.error}>{state.error}</p>}

        {contactOptions.length > 0 ? (
          <SingleSelectField
            key={`add-vendor-${fieldsResetKey}`}
            name="contact_id"
            label="Add an existing contact as a vendor"
            options={contactOptions}
            placeholder="Search contacts by name…"
            searchPlaceholder="Search contacts…"
            onChange={setSelectedContactId}
          />
        ) : (
          <p className={styles.description}>Every contact is already a vendor on this event.</p>
        )}

        {contactOptions.length > 0 && (
          <div className={styles.actions}>
            <SubmitButton pendingLabel="Adding…" disabled={!selectedContactId}>
              Add Vendor
            </SubmitButton>
          </div>
        )}
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
