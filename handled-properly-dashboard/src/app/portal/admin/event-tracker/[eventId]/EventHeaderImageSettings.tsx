"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setEventHeaderImage, removeEventHeaderImage, type ActionState } from "../actions";
import styles from "@/styles/admin-shared.module.css";

export default function EventHeaderImageSettings({
  eventId,
  hasImage,
}: {
  eventId: string;
  hasImage: boolean;
}) {
  const router = useRouter();
  const boundUpload = setEventHeaderImage.bind(null, eventId);
  const [state, formAction, isUploading] = useActionState<ActionState, FormData>(boundUpload, null);
  const wasUploading = useRef(false);
  const [isRemoving, startRemove] = useTransition();

  useEffect(() => {
    if (wasUploading.current && !isUploading && state === null) {
      router.refresh();
    }
    wasUploading.current = isUploading;
  }, [isUploading, state, router]);

  const handleRemove = () => {
    if (!confirm("Remove this event's header image?")) return;
    startRemove(async () => {
      await removeEventHeaderImage(eventId);
      router.refresh();
    });
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>Header image</span>
      <form action={formAction} className={styles.eventHeaderImageControls}>
        {state?.error && <p className={styles.error}>{state.error}</p>}
        <label className={styles.secondaryButton}>
          {isUploading ? "Uploading…" : hasImage ? "Change image" : "Add header image"}
          <input
            type="file"
            name="header_image"
            accept="image/*"
            hidden
            disabled={isUploading}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          />
        </label>
        {hasImage && (
          <button
            type="button"
            className={styles.dangerButton}
            disabled={isRemoving}
            onClick={handleRemove}
          >
            {isRemoving ? "Removing…" : "Remove"}
          </button>
        )}
      </form>
    </div>
  );
}
