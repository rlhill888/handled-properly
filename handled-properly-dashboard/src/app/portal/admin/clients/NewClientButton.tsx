"use client";

import { useState } from "react";
import Modal from "@/components/portal/Modal";
import NewClientForm from "./NewClientForm";
import InvitePromptModal from "./InvitePromptModal";
import styles from "@/styles/admin-shared.module.css";

export default function NewClientButton() {
  const [open, setOpen] = useState(false);
  const [createdClient, setCreatedClient] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <button type="button" className={styles.addButton} aria-label="Add Client" onClick={() => setOpen(true)}>
        +
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Client">
        <NewClientForm
          onCreated={(client) => {
            setOpen(false);
            setCreatedClient(client);
          }}
        />
      </Modal>
      <InvitePromptModal client={createdClient} onClose={() => setCreatedClient(null)} />
    </>
  );
}
