"use client";

import { useState, type ReactNode } from "react";
import Modal from "./Modal";

export default function ModalButton({
  label,
  ariaLabel,
  modalTitle,
  className,
  children,
}: {
  label: ReactNode;
  // Needed when label is an icon rather than readable text.
  ariaLabel?: string;
  modalTitle: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className={className} aria-label={ariaLabel} onClick={() => setOpen(true)}>
        {label}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle}>
        {children}
      </Modal>
    </>
  );
}
