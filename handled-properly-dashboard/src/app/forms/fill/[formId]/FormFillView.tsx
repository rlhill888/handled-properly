"use client";

import { useActionState } from "react";
import { submitForm, type ActionState } from "./actions";
import type { FillField } from "./data";
import { FONT_OPTIONS, hexToRgba, type FormTheme } from "@/lib/form-theme";
import styles from "./FormFillView.module.css";

function FieldInput({ field }: { field: FillField }) {
  const name = `field_${field.id}`;

  if (field.fieldType === "textarea") {
    return <textarea id={name} name={name} required={field.required} className={styles.textarea} />;
  }

  if (field.fieldType === "select") {
    return (
      <select id={name} name={name} required={field.required} className={styles.select} defaultValue="">
        <option value="" disabled>
          Select an option…
        </option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
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
  formId,
  name,
  description,
  theme,
  fields,
}: {
  formId: string;
  name: string;
  description: string;
  theme: FormTheme;
  fields: FillField[];
}) {
  const boundSubmit = submitForm.bind(null, formId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(boundSubmit, null);

  const surfaceStyle = {
    fontSize: `${theme.fontSize}px`,
    backgroundColor: theme.backgroundColor,
    backgroundImage:
      theme.backgroundMode === "full" && theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
  };

  const banner = theme.backgroundMode === "banner" && (name || theme.backgroundImage) && (
    <div
      className={styles.banner}
      style={{
        minHeight: `${theme.bannerHeight}px`,
        backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
      }}
    >
      <h1
        className={styles.bannerTitle}
        style={{
          fontFamily: FONT_OPTIONS[theme.titleFont],
          color: theme.titleColor,
          fontSize: `${theme.titleSize}px`,
          marginBottom: `${theme.titleMarginBottom}px`,
        }}
      >
        {name}
      </h1>
    </div>
  );

  const fullTitle = theme.backgroundMode === "full" && (
    <h1
      className={styles.title}
      style={{
        fontFamily: FONT_OPTIONS[theme.titleFont],
        color: theme.titleColor,
        fontSize: `${theme.titleSize}px`,
        marginBottom: `${theme.titleMarginBottom}px`,
      }}
    >
      {name}
    </h1>
  );

  if (state && "success" in state) {
    return (
      <div className={styles.page}>
        <div className={styles.card} style={surfaceStyle}>
          {banner}
          <div className={styles.successCard}>
            {fullTitle}
            <h2 className={styles.title}>Thanks!</h2>
            <p className={styles.description}>Your response has been submitted.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card} style={surfaceStyle}>
        {banner}
        {fullTitle}

        {description && (
          <div
            className={styles.descriptionCard}
            style={{ backgroundColor: hexToRgba(theme.questionBackgroundColor, theme.cardOpacity) }}
          >
            <p
              className={styles.description}
              style={{
                fontFamily: FONT_OPTIONS[theme.descriptionFont],
                color: theme.descriptionColor,
                fontSize: `${theme.descriptionSize}px`,
                marginBottom: `${theme.descriptionMarginBottom}px`,
              }}
            >
              {description}
            </p>
          </div>
        )}

        <form action={formAction} className={styles.form}>
          {state && "error" in state && <p className={styles.error}>{state.error}</p>}

          <div
            className={styles.field}
            style={{ backgroundColor: hexToRgba(theme.questionBackgroundColor, theme.cardOpacity) }}
          >
            <label className={styles.label} htmlFor="submitter_name">
              Your name<span className={styles.required}>*</span>
            </label>
            <input id="submitter_name" name="submitter_name" required className={styles.input} />
          </div>

          <div
            className={styles.field}
            style={{ backgroundColor: hexToRgba(theme.questionBackgroundColor, theme.cardOpacity) }}
          >
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
            <div
              key={field.id}
              className={styles.field}
              style={{
                backgroundColor: hexToRgba(
                  field.backgroundColor ?? theme.questionBackgroundColor,
                  theme.cardOpacity,
                ),
              }}
            >
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
