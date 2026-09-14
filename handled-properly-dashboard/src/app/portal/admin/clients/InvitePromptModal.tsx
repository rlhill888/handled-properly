"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/portal/Modal";
import { inviteClient } from "./actions";
import styles from "@/styles/admin-shared.module.css";

// Shown right after a Client is created (NewClientButton) or an Application
// is converted (ApplicationRow) — a one-time nudge to invite them to the
// Client Portal immediately, with an easy way to skip and invite later from
// their row on this same page (see ClientRow's own "Invite to Portal"
// button, which calls the same inviteClient action).
export default function InvitePromptModal({
  client,
  onClose,
}: {
  client: { id: string; name: string } | null;
  onClose: () => void;
}) {
  const [isInviting, startInviting] = useTransition();
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSent, setInviteSent] = useState(false);

  const handleClose = () => {
    onClose();
    setInviteError(null);
    setInviteSent(false);
  };

  const handleInviteNow = () => {
    if (!client) return;
    setInviteError(null);
    startInviting(async () => {
      const result = await inviteClient(client.id);
      if (result?.error) setInviteError(result.error);
      else setInviteSent(true);
    });
  };

  return (
    <Modal open={client !== null} onClose={handleClose} title={inviteSent ? "Invited" : "Invite to Portal"}>
      {client && (
        <div className={styles.form}>
          {inviteSent ? (
            <>
              <p className={styles.description}>{client.name} has been invited to the Client Portal.</p>
              <div className={styles.actions}>
                <button type="button" className={styles.secondaryButton} onClick={handleClose}>
                  Done
                </button>
              </div>
            </>
          ) : (
            <>
              <p className={styles.description}>
                {client.name} was added as a client. Invite them to the Client Portal now? You can
                always invite them later.
              </p>
              {inviteError && <p className={styles.error}>{inviteError}</p>}
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleInviteNow}
                  disabled={isInviting}
                >
                  {isInviting ? "Inviting…" : "Invite Now"}
                </button>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={handleClose}
                  disabled={isInviting}
                >
                  Invite Later
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
