"use client";

import { useActionState, useEffect, useState } from "react";
import { updateFeaturedItem, type ActionState } from "./actions";
import SubmitButton from "@/components/portal/SubmitButton";
import styles from "@/styles/admin-shared.module.css";
import type { FeaturedItem } from "@/lib/data/site-content";

export default function EditFeaturedItemForm({ item }: { item: FeaturedItem }) {
  const boundUpdate = updateFeaturedItem.bind(null, item.id);
  const [state, formAction] = useActionState<ActionState, FormData>(boundUpdate, null);

  // Instant local preview of the picked image file -- see the equivalent
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

  const displayUrl = previewUrl ?? item.imageUrl;

  return (
    <form action={formAction} className={styles.form}>
      {state?.error && <p className={styles.error}>{state.error}</p>}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-title-edit">
          Title
        </label>
        <input
          id="item-title-edit"
          name="title"
          required
          defaultValue={item.title}
          className={styles.input}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-description-edit">
          Description
        </label>
        <textarea
          id="item-description-edit"
          name="description"
          rows={3}
          defaultValue={item.description}
          className={styles.input}
        />
      </div>

      {displayUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayUrl}
          alt=""
          className={styles.eventHeaderImage}
          style={{ maxHeight: 160, width: "auto" }}
        />
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-image-edit">
          {item.imageUrl ? "Replace image" : "Add image"} <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="item-image-edit"
          name="image"
          type="file"
          accept="image/*"
          className={styles.input}
          onChange={handleFileChange}
        />
      </div>

      {item.imageUrl && !previewUrl && (
        <label className={styles.checkboxRow}>
          <input type="checkbox" name="remove_image" />
          Remove current image
        </label>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="item-link-edit">
          Link <span className={styles.optional}>(optional)</span>
        </label>
        <input
          id="item-link-edit"
          name="link_url"
          type="url"
          defaultValue={item.linkUrl ?? ""}
          className={styles.input}
        />
      </div>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Saving…">Save Changes</SubmitButton>
      </div>
    </form>
  );
}
