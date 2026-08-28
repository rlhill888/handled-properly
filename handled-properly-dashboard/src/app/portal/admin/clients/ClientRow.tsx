"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { updateClientRecord, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export type ClientRowData = {
  clientId: string;
  contactId: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  notes: string | null;
};

export default function ClientRow({ client }: { client: ClientRowData }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateClientRecord,
    null
  );
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !isPending && state === null) {
      setEditing(false);
    }
    wasPending.current = isPending;
  }, [isPending, state]);

  if (!editing) {
    return (
      <tr>
        <td data-label="Name" className={styles.cardPrimaryCell}>
          {client.name}
        </td>
        <td data-label="Email">{client.email}</td>
        <td data-label="Phone">{client.phone || "—"}</td>
        <td data-label="Company">{client.companyName || "—"}</td>
        <td className={styles.cardActionCell}>
          <button type="button" className={styles.secondaryButton} onClick={() => setEditing(true)}>
            Edit
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={5}>
        <form action={formAction} className={styles.form}>
          <input type="hidden" name="client_id" value={client.clientId} />
          <input type="hidden" name="contact_id" value={client.contactId} />

          {state?.error && <p className={styles.error}>{state.error}</p>}

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Name</label>
              <input name="name" defaultValue={client.name} required className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                defaultValue={client.email}
                required
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.field}>
              <label className={styles.label}>Phone</label>
              <input name="phone" defaultValue={client.phone ?? ""} className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Company</label>
              <input
                name="company_name"
                defaultValue={client.companyName ?? ""}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Notes</label>
            <textarea name="notes" defaultValue={client.notes ?? ""} className={styles.textarea} />
          </div>

          <div className={styles.actions}>
            <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
            <button type="button" className={styles.secondaryButton} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      </td>
    </tr>
  );
}
