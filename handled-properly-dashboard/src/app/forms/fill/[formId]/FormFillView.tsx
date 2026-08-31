"use client";

import { useActionState, useEffect, useState } from "react";
import { submitForm, type ActionState } from "./actions";
import type { FillField } from "./data";
import {
  getPageBackgroundAnimationClass,
  getPageBackgroundStyle,
  getSubmitButtonStyle,
  type FormTheme,
} from "@/lib/form-theme";
import FormRenderSurface, { type RenderSurfaceField } from "@/components/FormRenderSurface";
import Spinner from "@/components/Spinner";
import styles from "./FormFillView.module.css";

function FieldInput({ field }: { field: FillField }) {
  const name = `field_${field.id}`;

  if (field.fieldType === "textarea") {
    return <textarea id={name} name={name} required={field.required} className={styles.textarea} />;
  }

  if (field.fieldType === "select") {
    const options = field.options ?? [];
    if (options.length === 0) {
      return (
        <select id={name} className={styles.select} disabled defaultValue="">
          <option value="">No options configured</option>
        </select>
      );
    }
    return (
      <select id={name} name={name} required={field.required} className={styles.select} defaultValue="">
        <option value="" disabled>
          Select an option…
        </option>
        {options.map((option) => (
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

// A minimum-duration loading beat before the form is revealed (see the CSS
// transition below), floored so it's always felt even on a fast connection,
// and — when the theme has a background image — extended until that image
// has actually decoded, so the reveal never flashes an un-rendered image.
function useReady(theme: FormTheme): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const floor = new Promise<void>((resolve) => setTimeout(resolve, 500));
    const imageReady = theme.backgroundImage
      ? (() => {
          const img = new window.Image();
          img.src = theme.backgroundImage!;
          return img.decode().catch(() => undefined);
        })()
      : Promise.resolve();

    Promise.all([floor, imageReady]).then(() => setReady(true));
  }, [theme.backgroundImage]);

  return ready;
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
  const ready = useReady(theme);

  const chrome: RenderSurfaceField[] = [
    {
      id: "submitter_name",
      label: "Your name",
      required: true,
      input: <input id="submitter_name" name="submitter_name" required className={styles.input} />,
    },
    {
      id: "submitter_email",
      label: "Your email",
      required: true,
      input: (
        <input id="submitter_email" name="submitter_email" type="email" required className={styles.input} />
      ),
    },
  ];

  const renderFields: RenderSurfaceField[] = fields.map((field) => ({
    id: `field_${field.id}`,
    label: field.label,
    description: field.description,
    required: field.required,
    backgroundColor: field.backgroundColor,
    input: <FieldInput field={field} />,
  }));

  const pageBackgroundStyle = getPageBackgroundStyle(theme);
  const pageBackgroundAnimationClass = getPageBackgroundAnimationClass(theme);

  return (
    <>
      <div
        className={`${styles.loadingOverlay} ${ready ? styles.loadingOverlayHidden : ""} ${pageBackgroundAnimationClass}`}
        style={pageBackgroundStyle}
        aria-hidden={ready}
      >
        <Spinner size={32} />
      </div>

      <div
        className={`${styles.page} ${ready ? styles.contentEnterActive : styles.contentEnter} ${pageBackgroundAnimationClass}`}
        style={pageBackgroundStyle}
      >
        <form action={formAction}>
          <FormRenderSurface
            name={name}
            description={description}
            theme={theme}
            errorMessage={state && "error" in state ? state.error : null}
            successMessage={state && "success" in state ? "Your response has been submitted." : undefined}
            chrome={chrome}
            fields={renderFields}
            footer={
              <button
                type="submit"
                className={styles.submitButton}
                style={getSubmitButtonStyle(theme)}
                disabled={isPending}
              >
                {isPending ? "Submitting…" : "Submit"}
              </button>
            }
          />
        </form>
      </div>
    </>
  );
}
