import type { ReactNode, Ref } from "react";
import { FONT_OPTIONS, hexToRgba, type FormTheme } from "@/lib/form-theme";
import styles from "./FormRenderSurface.module.css";

// The one place a Form's theme + fields turn into actual markup — shared by
// the public fill page (src/app/forms/fill/[formId]/FormFillView.tsx) and
// every preview in the admin FormBuilder (inline tab + full-screen), so the
// two can never visually drift apart the way they used to.

export type RenderSurfaceField = {
  id: string;
  label: string;
  description?: string | null;
  required?: boolean;
  backgroundColor?: string;
  input: ReactNode;
};

export type FormRenderSurfaceProps = {
  name: string;
  description: string;
  theme: FormTheme;
  errorMessage?: string | null;
  successMessage?: string;
  chrome?: RenderSurfaceField[];
  fields: RenderSurfaceField[];
  emptyState?: ReactNode;
  footer?: ReactNode;
  surfaceRef?: Ref<HTMLDivElement>;
};

function FieldRow({ field, theme }: { field: RenderSurfaceField; theme: FormTheme }) {
  const trimmedLabel = field.label.trim();

  return (
    <div
      className={styles.field}
      style={{
        backgroundColor: hexToRgba(field.backgroundColor ?? theme.questionBackgroundColor, theme.cardOpacity),
      }}
    >
      <label className={`${styles.label} ${trimmedLabel ? "" : styles.labelFallback}`} htmlFor={field.id}>
        {trimmedLabel || "Untitled question"}
        {field.required && <span className={styles.required}>*</span>}
      </label>
      {field.description && <p className={styles.fieldDescription}>{field.description}</p>}
      {field.input}
    </div>
  );
}

export default function FormRenderSurface({
  name,
  description,
  theme,
  errorMessage,
  successMessage,
  chrome = [],
  fields,
  emptyState,
  footer,
  surfaceRef,
}: FormRenderSurfaceProps) {
  const surfaceStyle = {
    fontSize: `${theme.fontSize}px`,
    backgroundColor: theme.backgroundColor,
    backgroundImage:
      theme.backgroundMode === "full" && theme.backgroundImage ? `url(${theme.backgroundImage})` : undefined,
  };

  const showBanner = theme.backgroundMode === "banner" && Boolean(name || theme.backgroundImage);
  const showFullTitle = theme.backgroundMode === "full" && Boolean(name);

  const banner = showBanner && (
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

  const fullTitle = showFullTitle && (
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

  if (successMessage) {
    return (
      <div ref={surfaceRef} className={styles.surface} style={surfaceStyle}>
        {banner}
        <div className={styles.successCard}>
          {fullTitle}
          <h2 className={styles.title}>Thanks!</h2>
          <p className={styles.description}>{successMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={surfaceRef} className={styles.surface} style={surfaceStyle}>
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

      <div className={styles.fieldsColumn}>
        {errorMessage && <p className={styles.error}>{errorMessage}</p>}

        {chrome.map((field) => (
          <FieldRow key={field.id} field={field} theme={theme} />
        ))}

        {chrome.length > 0 && fields.length > 0 && <hr className={styles.divider} />}

        {fields.length > 0 ? fields.map((field) => <FieldRow key={field.id} field={field} theme={theme} />) : emptyState}

        {footer}
      </div>
    </div>
  );
}
