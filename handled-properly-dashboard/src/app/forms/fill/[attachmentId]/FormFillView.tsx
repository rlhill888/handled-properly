"use client";

import { useActionState } from "react";
import { submitForm, type ActionState } from "./actions";
import type { FillField } from "./data";
import styles from "./FormFillView.module.css";

function FieldInput({ field }: { field: FillField }) {
  const name = `field_${field.id}`;

  if (field.fieldType === "textarea") {
    return <textarea id={name} name={name} required={field.required} className={styles.textarea} />;
  }

  if (field.fieldType === "select") {
    // No configurable options exist on a Form Field yet (a pre-existing gap
    // in Form Templates, not introduced here) — render the same empty
    // dropdown the admin builder's own preview shows.
    return (
      <select id={name} name={name} required={field.required} className={styles.select} defaultValue="">
        <option value="" disabled>
          Select an option…
        </option>
      </select>
    );
  }

  if (field.fieldType === "file") {
    return (
      <input
        id={name}
        name={name}
        type="file"
        required={field.required}
        accept="image/*,video/*"
        className={styles.input}
      />
    );
  }

  return (
    <input id={name} name={name} type={field.fieldType} required={field.required} className={styles.input} />
  );
}

export default function FormFillView({
  attachmentId,
  templateName,
  templateDescription,
  fields,
}: {
  attachmentId: string;
  templateName: string;
  templateDescription: string;
  fields: FillField[];
}) {
  const boundSubmit = submitForm.bind(null, attachmentId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundSubmit, null);

  if (state && "success" in state) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.successCard}>
            <h1 className={styles.title}>Thanks!</h1>
            <p className={styles.description}>Your response has been submitted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{templateName}</h1>
        {templateDescription && <p className={styles.description}>{templateDescription}</p>}

        <form action={formAction} className={styles.form}>
          {state && "error" in state && <p className={styles.error}>{state.error}</p>}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="submitter_name">
              Your name<span className={styles.required}>*</span>
            </label>
            <input id="submitter_name" name="submitter_name" required className={styles.input} />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="submitter_email">
              Your email<span className={styles.required}>*</span>
            </label>
            <input
              id="submitter_email"
              name="submitter_email"
              type="email"
              required
              className={styles.input}
            />
          </div>

          {fields.length > 0 && <hr className={styles.divider} />}

          {fields.map((field) => (
            <div key={field.id} className={styles.field}>
              <label className={styles.label} htmlFor={`field_${field.id}`}>
                {field.label}
                {field.required && <span className={styles.required}>*</span>}
              </label>
              {field.description && <p className={styles.fieldDescription}>{field.description}</p>}
              <FieldInput field={field} />
            </div>
          ))}

          <button type="submit" className={styles.submitButton} disabled={isPending}>
            {isPending ? "Submitting…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
