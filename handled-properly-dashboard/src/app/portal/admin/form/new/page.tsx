"use client";

import FormBuilder from "@/components/FormBuilder";
import { createFormTemplate } from "../actions";
import styles from "../form-editor.module.css";

export default function NewFormTemplatePage() {
  return (
    <div className={styles.page}>
      <a href="/portal/admin/form" className={styles.back}>
        ← Back to Forms
      </a>

      <span className={styles.eyebrow}>Admin</span>
      <h1 className={styles.title}>New Form Template</h1>
      <p className={styles.description}>
        Give it a title, add fields, then save.
      </p>

      <div className={styles.builderWrapper}>
        <FormBuilder initialFields={[]} onSave={createFormTemplate} saveLabel="Create Template" />
      </div>
    </div>
  );
}
