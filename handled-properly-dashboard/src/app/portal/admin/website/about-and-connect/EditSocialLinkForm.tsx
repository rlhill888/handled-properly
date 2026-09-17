"use client";

import { useActionState, useEffect, useState } from "react";
import { updateSocialLink, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { SocialLink } from "@/lib/data/site-content";

export default function EditSocialLinkForm({ link }: { link: SocialLink }) {
  const boundUpdate = updateSocialLink.bind(null, link.id);
  const [state, formAction] = useActionState<ActionState, FormData>(boundUpdate, null);

  // Instant local preview of the picked icon file -- see the equivalent
  // comment in AboutForm.tsx for why an object URL rather than waiting on
  // the upload/save round-trip.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const displayUrl = previewUrl ?? link.iconUrl;

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayUrl} alt="" style={{ height: 40, width: 40, objectFit: "contain" }} />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="social-icon-edit">
          Replace icon <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="social-icon-edit"
          name="icon"
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="social-url-edit">
          Link
        </label>
        <input
          id="social-url-edit"
          name="url"
          type="url"
          required
          defaultValue={link.url}
          className={styles.input}
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
