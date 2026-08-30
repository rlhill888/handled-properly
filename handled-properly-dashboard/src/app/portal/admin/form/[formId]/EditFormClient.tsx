"use client";

import Link from "next/link";
import FormBuilder, { type FormTheme, type FormField } from "@/components/FormBuilder";
import { updateForm, deleteForm } from "../actions";
import { useRouter } from "next/navigation";
import styles from "../form-editor.module.css";
import sharedStyles from "@/styles/admin-shared.module.css";

export default function EditFormClient({
  formId,
  initialTitle,
  initialDescription,
  initialTheme,
  initialFields,
  fillUrl,
  scopeLabel,
}: {
  formId: string;
  initialTitle: string;
  initialDescription: string;
  initialTheme: FormTheme;
  initialFields: FormField[];
  fillUrl: string;
  scopeLabel: string;
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${initialTitle}"? This can't be undone.`)) return;
    const result = await deleteForm(formId);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.push("/portal/admin/form");
  };

  return (
    <div className={styles.page}>
      <Link href="/portal/admin/form" className={styles.backLink} aria-label="Back to Forms">
        ←
      </Link>

      <span className={styles.eyebrow}>Admin</span>
      <h1 className={styles.title}>Edit Form</h1>
      <p className={styles.description}>
        Changes save when you click Save — nothing persists until then.
      </p>

      <div className={sharedStyles.metaRow}>
        <span className={sharedStyles.badgeMuted}>{scopeLabel}</span>
        <Link href={`/portal/admin/form/results/${formId}`} className={sharedStyles.link}>
          View results
        </Link>
      </div>

      <div>
        <span className={styles.description}>Fill link</span>
        <br />
        <code style={{ fontSize: 12, wordBreak: "break-all" }}>{fillUrl}</code>
      </div>

      <button type="button" className={styles.back} onClick={handleDelete}>
        Delete this form
      </button>

      <div className={styles.builderWrapper}>
        <FormBuilder
          initialFields={initialFields}
          initialTitle={initialTitle}
          initialDescription={initialDescription}
          initialTheme={initialTheme}
          onSave={(data) => updateForm(formId, data)}
          saveLabel="Save Changes"
        />
      </div>
    </div>
  );
}
