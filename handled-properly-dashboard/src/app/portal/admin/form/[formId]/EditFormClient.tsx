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
}: {
  formId: string;
  initialTitle: string;
  initialDescription: string;
  initialTheme: FormTheme;
  initialFields: FormField[];
  fillUrl: string;
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

      <div className={`${sharedStyles.card} ${styles.metaCard}`}>
        <div className={sharedStyles.metaRow}>
          <Link href={`/portal/admin/form/results/${formId}`} className={sharedStyles.secondaryButton}>
            View results
          </Link>
        </div>

        <div className={sharedStyles.field}>
          <span className={sharedStyles.label}>Fill link</span>
          <a href={fillUrl} target="_blank" rel="noreferrer" className={styles.fillLink}>
            {fillUrl}
          </a>
        </div>

        <div className={sharedStyles.actions}>
          <button type="button" className={sharedStyles.dangerButton} onClick={handleDelete}>
            Delete this form
          </button>
        </div>
      </div>

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
