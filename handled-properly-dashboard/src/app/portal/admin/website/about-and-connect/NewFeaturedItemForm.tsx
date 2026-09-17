"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createFeaturedItem, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";

export default function NewFeaturedItemForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createFeaturedItem, null);
  const formRef = useRef<HTMLFormElement>(null);
  const previousState = useRef<ActionState>(null);

  // Instant local preview of the picked image file -- see the equivalent
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

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-title">
          Title
        </label>
        <input id="item-title" name="title" required className={styles.input} placeholder="e.g. Event Planning Guide" />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-description">
          Description
        </label>
        <textarea id="item-description" name="description" rows={3} className={styles.input} />
      </div>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="" className={styles.eventHeaderImage} style={{ maxHeight: 160, width: "auto" }} />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-image">
          Image <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="item-image"
          name="image"
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleFileChange}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-link">
          Link <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="item-link"
          name="link_url"
          type="url"
          className={styles.input}
          placeholder="https://…"
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Adding…">Add Item</SubmitButton>
      </div>
    </form>
  );
}
