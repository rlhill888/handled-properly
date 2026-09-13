"use client";

import { useEffect } from "react";
import styles from "./Modal.module.css";

export default function Modal({
  open,
  onClose,
  title,
  children,
  titleVariant = "eyebrow",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // "eyebrow" (default, unchanged) is the small uppercase label every
  // existing modal uses. "heading" renders `title` as a large heading
  // instead — for a caller presenting the modal as a full detail view
  // (e.g. the staff Event Task modal) rather than a small dialog.
  titleVariant?: "eyebrow" | "heading";
}) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.dialogHeader}>
          <h2 className={titleVariant === "heading" ? styles.dialogTitleHeading : styles.dialogTitle}>
            {title}
          </h2>
          <button type="button" className={styles.closeButton} aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
