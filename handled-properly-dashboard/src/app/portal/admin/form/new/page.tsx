"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import FormBuilder from "@/components/FormBuilder";
import { createForm, type FormTarget } from "../actions";
import styles from "../form-editor.module.css";

export default function NewFormPage() {
  const searchParams = useSearchParams();
  const targetType = searchParams.get("targetType") as FormTarget["targetType"] | null;
  const targetId = searchParams.get("targetId");
  const basePath = searchParams.get("basePath");
  const target: FormTarget | undefined =
    targetType && targetId && basePath ? { targetType, targetId, basePath } : undefined;

  return (
    <div className={styles.page}>
      <Link href={target?.basePath ?? "/portal/admin/form"} className={styles.backLink} aria-label="Back">
        ←
      </Link>

      <span className={styles.eyebrow}>Admin</span>
      <h1 className={styles.title}>New Form</h1>
      <p className={styles.description}>
        Give it a title, add fields, then save.
      </p>

      <div className={styles.builderWrapper}>
        <FormBuilder
          initialFields={[]}
          onSave={(data) => createForm(data, target)}
          saveLabel="Create Form"
        />
      </div>
    </div>
  );
}
