"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createSocialLink, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewSocialLinkForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createSocialLink, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);

  // Instant local preview of the picked icon file -- see the equivalent
  // comment in AboutForm.tsx for why an object URL rather than waiting on
  // the upload/save round-trip.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (previousState.current !== null && state === null) {
      formRef.current?.reset();
      setPreviewUrl(null);
    }
    previousState.current = state;
  }, [state]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" style={{ height: 40, width: 40, objectFit: "contain" }} />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="social-icon">
          Icon
        </label>
        <input
          id="social-icon"
          name="icon"
          type="file"
          accept="image/*"
          required
          className={styles.input}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="social-url">
          Link
        </label>
        <input
          id="social-url"
          name="url"
          type="url"
          required
          className={styles.input}
          placeholder="https://instagram.com/yourhandle"
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Social Link</SubmitButton>
      </div>
    </form>
  );
}
