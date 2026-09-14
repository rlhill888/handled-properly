"use client";

import { useFormStatus } from "react-dom";
import styles from "@/styles/admin-shared.module.css";

export default function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  className,
  ariaLabel,
  disabled = false,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "secondary";
  className?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const variantClass = variant === "primary" ? styles.primaryButton : styles.secondaryButton;

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-label={ariaLabel}
      className={className ? `${variantClass} ${className}` : variantClass}
    >
      {pending ? pendingLabel ?? "Saving…" : children}
    </button>
  );
}
