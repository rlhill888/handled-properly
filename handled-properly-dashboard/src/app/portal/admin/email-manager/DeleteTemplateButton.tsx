"use client";

import { useTransition } from "react";
import { deleteEmailTemplate } from "./templates-actions";
import styles from "@/styles/admin-shared.module.css";

export default function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm("Delete this template?")) return;
    startTransition(() => {
      deleteEmailTemplate(templateId);
    });
  };

  return (
    <button type="button" className={styles.dangerButton} disabled={isPending} onClick={handleDelete}>
      Delete
    </button>
  );
}
