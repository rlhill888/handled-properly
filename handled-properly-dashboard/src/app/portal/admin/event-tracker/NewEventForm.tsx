"use client";

import { useActionState, useState } from "react";
import { createEvent, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import SelectDropdown from "@/components/portal/SelectDropdown";
import Modal from "@/components/portal/Modal";
import NewClientForm from "@/app/portal/admin/clients/NewClientForm";
import styles from "@/styles/admin-shared.module.css";

type ClientOption = { id: string; name: string };

export default function NewEventForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(createEvent, null);
  const [clientOptions, setClientOptions] = useState(clients);
  const [clientId, setClientId] = useState("");
  const [newClientOpen, setNewClientOpen] = useState(false);

  return (
    <>
      <form action={formAction} className={styles.form}>
        {state?.error && <p className={styles.error}>{state.error}</p>}

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="client_id">
              Client
            </label>
            <input type="hidden" id="client_id" name="client_id" value={clientId} />
            <SelectDropdown
              options={clientOptions.map((client) => ({ id: client.id, label: client.name }))}
              value={clientId}
              onChange={setClientId}
              placeholder="Select a client…"
              searchable
              searchPlaceholder="Search clients…"
              createLabel="New Client"
              onCreate={() => setNewClientOpen(true)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Event Name
            </label>
            <input
              id="name"
              name="name"
              required
              className={styles.input}
              placeholder="Fall Gala"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="starts_at">
              Starts <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              className={styles.input}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ends_at">
              Ends <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              className={styles.input}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">
            Location <span className={styles.optional}>(optional)</span>
          </label>
          <input id="location" name="location" className={styles.input} />
        </div>

        <div className={styles.actions}>
          <SubmitButton pendingLabel="Creating…">Create Event</SubmitButton>
        </div>
      </form>

      <Modal open={newClientOpen} onClose={() => setNewClientOpen(false)} title="New Client">
        <NewClientForm
          onCreated={(client) => {
            setClientOptions((current) => [...current, client]);
            setClientId(client.id);
            setNewClientOpen(false);
          }}
        />
      </Modal>
    </>
  );
}
