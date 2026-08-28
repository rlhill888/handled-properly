"use client";

import FormBuilder, { type FormTheme, type FormField } from "@/components/FormBuilder";
import { updateFormTemplate, deleteFormTemplate } from "../actions";
import { useRouter } from "next/navigation";
import styles from "../form-editor.module.css";

export default function EditFormTemplateClient({
  templateId,
  initialTitle,
  initialDescription,
  initialTheme,
  initialFields,
}: {
  templateId: string;
  initialTitle: string;
  initialDescription: string;
  initialTheme: FormTheme;
  initialFields: FormField[];
}) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Delete "${initialTitle}"? This can't be undone.`)) return;
    const result = await deleteFormTemplate(templateId);
    if (result?.error) {
      alert(result.error);
      return;
    }
    router.push("/portal/admin/form");
  };

  return (
    <div className={styles.page}>
      <a href="/portal/admin/form" className={styles.backLink} aria-label="Back to Forms">
        ←
      </a>

      <span className={styles.eyebrow}>Admin</span>
      <h1 className={styles.title}>Edit Form Template</h1>
      <p className={styles.description}>
        Changes save when you click Save — nothing persists until then.
      </p>

      <button type="button" className={styles.back} onClick={handleDelete}>
        Delete this template
      </button>

      <div className={styles.builderWrapper}>
        <FormBuilder
          initialFields={initialFields}
          initialTitle={initialTitle}
          initialDescription={initialDescription}
          initialTheme={initialTheme}
          onSave={(data) => updateFormTemplate(templateId, data)}
          saveLabel="Save Changes"
        />
      </div>
    </div>
  );
}
