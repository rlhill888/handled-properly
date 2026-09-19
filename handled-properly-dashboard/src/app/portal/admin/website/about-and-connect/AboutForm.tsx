"use client";

import { useActionState, useEffect, useState } from "react";
import { updateAboutPageContent, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { AboutPageContent } from "@/lib/data/site-content";

// Matches the server action's own check -- catches an obviously bad value
// (typo, a named color, missing "#") before the round trip instead of
// only after submitting.
const HEX_COLOR_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export default function AboutForm({ about }: { about: AboutPageContent }) {
  const [state, formAction] = useActionState<ActionState, FormData>(updateAboutPageContent, null);

  // Instant local preview of the picked file -- object URLs point straight
  // at the in-browser file, so this shows up the moment a file is chosen,
  // not just after the upload/save round-trip finishes and the page
  // re-fetches about.headshotUrl from the database.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [backgroundColor, setBackgroundColor] = useState(about.backgroundColor ?? "");
  const [fadeIntensity, setFadeIntensity] = useState(about.profileFadeIntensity);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (bgPreviewUrl) URL.revokeObjectURL(bgPreviewUrl);
    };
  }, [previewUrl, bgPreviewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleBackgroundFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setBgPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const displayUrl = previewUrl ?? about.headshotUrl;
  const bgDisplayUrl = bgPreviewUrl ?? about.backgroundImageUrl;
  const swatchColor = HEX_COLOR_RE.test(backgroundColor) ? backgroundColor : "#ffffff";

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
        <span className={styles.label}>Headshot photo</span>
        <div className={styles.eventHeaderImageControls}>
          <label className={styles.secondaryButton} htmlFor="about-headshot">
            {about.headshotUrl ? "Replace headshot" : "Add headshot"}
            <input
              id="about-headshot"
              name="headshot"
              type="file"
              accept="image/*"
              hidden
              onChange={handleFileChange}
            />
          </label>

          {about.headshotUrl && !previewUrl && (
            <label className={styles.checkboxRow}>
              <input type="checkbox" name="remove_headshot" />
              Remove current
            </label>
          )}
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="about-fade-intensity">
          Photo fade{" "}
          <span className={styles.optional}>
            (what percentage of the bottom of the photo fades away to transparent, revealing the page behind it — 0
            is no fade at all, 100 fades the whole photo away)
          </span>
        </label>
        <div className={styles.formRow} style={{ alignItems: "center", gap: 12 }}>
          <input
            id="about-fade-intensity"
            name="profile_fade_intensity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={fadeIntensity}
            onChange={(e) => setFadeIntensity(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <span className={styles.pill}>{fadeIntensity}</span>
        </div>
      </div>

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

      <div className={styles.formSection}>
        <span className={styles.formSectionLabel}>Page Background</span>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="about-bg-color">
            Background color <span className={styles.optional}>(optional — leave blank for the default white)</span>
          </label>
          <div className={styles.formRow}>
            <input
              id="about-bg-color"
              name="background_color"
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              placeholder="#0a0a0a"
              className={styles.input}
              style={{ flex: 1 }}
            />
            <input
              type="color"
              aria-label="Pick a background color"
              value={swatchColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className={styles.input}
              style={{ flex: "0 0 auto", width: 48, padding: 3, cursor: "pointer" }}
            />
            {backgroundColor && (
              <button
                type="button"
                className={styles.secondaryButton}
                style={{ flex: "0 0 auto" }}
                onClick={() => setBackgroundColor("")}
              >
                Use default
              </button>
            )}
          </div>
        </div>

        {bgDisplayUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bgDisplayUrl}
            alt=""
            className={styles.eventHeaderImage}
            style={{ maxHeight: 160, width: "auto" }}
          />
        )}

        <div className={styles.field}>
          <span className={styles.label}>
            Background image{" "}
            <span className={styles.optional}>
              (optional — covers the color above; the site&apos;s decorative diamonds are hidden while one is set)
            </span>
          </span>
          <div className={styles.eventHeaderImageControls}>
            <label className={styles.secondaryButton} htmlFor="about-bg-image">
              {about.backgroundImageUrl ? "Replace background image" : "Add background image"}
              <input
                id="about-bg-image"
                name="background_image"
                type="file"
                accept="image/*"
                hidden
                onChange={handleBackgroundFileChange}
              />
            </label>

            {about.backgroundImageUrl && !bgPreviewUrl && (
              <label className={styles.checkboxRow}>
                <input type="checkbox" name="remove_background_image" />
                Remove current
              </label>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
