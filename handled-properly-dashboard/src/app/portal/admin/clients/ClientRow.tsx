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
  const [expanded, setExpanded] = useState(false);
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

  return (
    <div className={styles.accordionItem}>
      <button
        type="button"
        className={styles.accordionHeader}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <span className={styles.accordionTitle}>{client.name}</span>
        <span
          className={`${styles.accordionChevron} ${expanded ? styles.accordionChevronOpen : ""}`}
          aria-hidden="true"
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className={styles.accordionBody}>
          {!editing ? (
            <>
              <table className={`${styles.table} ${styles.keyValueTable}`}>
                <tbody>
                  <tr>
                    <td>Email</td>
                    <td>{client.email}</td>
                  </tr>
                  <tr>
                    <td>Phone</td>
                    <td>{client.phone || "—"}</td>
                  </tr>
                  <tr>
                    <td>Company</td>
                    <td>{client.companyName || "—"}</td>
                  </tr>
                  {client.notes && (
                    <tr>
                      <td>Notes</td>
                      <td>{client.notes}</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
              </div>
            </>
          ) : (
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
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
