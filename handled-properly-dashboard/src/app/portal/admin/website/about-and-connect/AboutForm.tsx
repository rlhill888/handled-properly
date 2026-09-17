"use client";

import { useActionState, useEffect, useState } from "react";
import { updateAboutPageContent, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { AboutPageContent } from "@/lib/data/site-content";

export default function AboutForm({ about }: { about: AboutPageContent }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateAboutPageContent, null);

  // Instant local preview of the picked file -- object URLs point straight
  // at the in-browser file, so this shows up the moment a file is chosen,
  // not just after the upload/save round-trip finishes and the page
  // re-fetches about.headshotUrl from the database.
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

  const displayUrl = previewUrl ?? about.headshotUrl;

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt=""
          className={styles.eventHeaderImage}
          style={{ maxWidth: 240, maxHeight: 240, objectFit: "cover" }}
        />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-headshot">
          {about.headshotUrl ? "Replace headshot" : "Headshot photo"}
        </label>
        <input
          id="about-headshot"
          name="headshot"
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleFileChange}
        />
      </div>

      {about.headshotUrl && !previewUrl && (
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="remove_headshot" />
          Remove current headshot
        </label>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-body">
          About section
        </label>
        <textarea
          id="about-body"
          name="about_body"
          rows={8}
          defaultValue={about.aboutBody}
          className={styles.input}
          placeholder="Tell visitors who you are and what you do…"
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
