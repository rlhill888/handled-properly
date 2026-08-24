"use client";

import { useActionState } from "react";
import { createConversation, type ActionState } from "@/lib/actions/conversations";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewConversationForm({
  eventId,
  basePath,
  rosterStaff,
}: {
  eventId: string;
  basePath: string;
  rosterStaff: { id: string; name: string }[];
}) {
  const boundAction = createConversation.bind(null, eventId, basePath);
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <span className={styles.label}>Participants</span>
        <div className={styles.metaRow}>
          {rosterStaff.length === 0 && (
            <span className={styles.emptyState}>No one else on this event's roster yet.</span>
          )}
          {rosterStaff.map((staff) => (
            <label key={staff.id} className={styles.checkboxRow}>
              <input type="checkbox" name="participant_ids" value={staff.id} />
              {staff.name}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Starting…">Start Conversation</SubmitButton>
      </div>
    </form>
  );
}
