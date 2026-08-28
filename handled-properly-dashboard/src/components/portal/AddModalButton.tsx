"use client";

import { useState } from "react";
import Modal from "./Modal";
import styles from "@/styles/admin-shared.module.css";

export default function AddModalButton({
  label,
  modalTitle,
  children,
}: {
  label: string;
  modalTitle: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={styles.addButton}
        aria-label={label}
        onClick={() => setOpen(true)}
      >
        +
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        {children}
      </Modal>
    </>
  );
}
