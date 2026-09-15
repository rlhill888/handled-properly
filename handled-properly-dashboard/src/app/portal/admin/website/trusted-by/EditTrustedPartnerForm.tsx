"use client";

import { useActionState } from "react";
import { updateTrustedPartner, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { TrustedPartner } from "@/lib/data/site-content";

export default function EditTrustedPartnerForm({ partner }: { partner: TrustedPartner }) {
  const boundUpdate = updateTrustedPartner.bind(null, partner.id);
  const [state, formAction] = useActionState<ActionState, FormData>(boundUpdate, null);

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="partner-name-edit">
          Name
        </label>
        <input
          id="partner-name-edit"
          name="name"
          required
          defaultValue={partner.name}
          className={styles.input}
        />
      </div>

      {partner.logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={partner.logoUrl} alt="" className={styles.eventHeaderImage} style={{ maxHeight: 80, width: "auto" }} />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="partner-logo-edit">
          {partner.logoUrl ? "Replace logo" : "Add logo"} <span className={styles.optional}>(optional)</span>
        </label>
        <input id="partner-logo-edit" name="logo" type="file" accept="image/*" className={styles.input} />
      </div>

      {partner.logoUrl && (
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="remove_logo" />
          Remove current logo
        </label>
      )}

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
