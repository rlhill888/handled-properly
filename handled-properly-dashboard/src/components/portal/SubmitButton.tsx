"use client";

import { useFormStatus } from "react-dom";
import styles from "@/styles/admin-shared.module.css";

export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={variant === "primary" ? styles.primaryButton : styles.secondaryButton}
    >
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}
