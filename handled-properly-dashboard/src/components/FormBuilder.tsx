"use client";

import { useEffect, useRef, useState } from "react";
import Modal from "@/components/portal/Modal";
import AiGeneratingOverlay from "@/components/AiGeneratingOverlay";
import FormRenderSurface, { type RenderSurfaceField } from "@/components/FormRenderSurface";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { generateFormWithAI, reviewFormScreenshotAction } from "@/app/portal/admin/form/ai-actions";
import type { AiFormDesign } from "@/lib/ai-form-design";
import {
  DEFAULT_THEME,
  getPageBackgroundAnimationClass,
  getPageBackgroundStyle,
  getSubmitButtonStyle,
  type FormTheme,
  type FontOption,
} from "@/lib/form-theme";
import styles from "./FormBuilder.module.css";
import sharedStyles from "@/styles/admin-shared.module.css";

export { DEFAULT_THEME, type FormTheme } from "@/lib/form-theme";

const MAX_REVISION_ROUNDS = 3;

function waitForPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "file";

export type FormField = {
  id: string;
  label: string;
  description?: string;
  type: FormFieldType;
  required: boolean;
  backgroundColor?: string;
  options?: string[];
};

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: "Text",
  email: "Email",
  tel: "Phone",
  number: "Number",
  date: "Date",
  textarea: "Long Answer",
  select: "Dropdown",
  file: "Image/Video Upload",
};

function FieldPreview({ field }: { field: FormField }) {
  if (field.type === "textarea") {
    return <textarea className={styles.previewInput} rows={3} disabled />;
  }

  if (field.type === "select") {
    const options = field.options ?? [];
    if (options.length === 0) {
      return (
        <select className={styles.previewInput} disabled defaultValue="">
          <option value="">No options configured</option>
        </select>
      );
    }
    return (
      <select className={styles.previewInput} disabled defaultValue="">
        <option value="" disabled>
          Select an option…
        </option>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "file") {
    return (
      <span className={styles.fileButton}>
        Upload image or video
        <input
          type="file"
          accept="image/*,video/*"
          className={styles.fileInput}
          disabled
        />
      </span>
    );
  }

  return <input className={styles.previewInput} type={field.type} disabled />;
}

// Decorative name/email chrome shown in every preview (inline tab and
// full-screen) so admins see the same submitter fields a client would.
const PREVIEW_CHROME: RenderSurfaceField[] = [
  {
    id: "preview_name",
    label: "Your name",
    required: true,
    input: <input className={styles.previewInput} type="text" disabled />,
  },
  {
    id: "preview_email",
    label: "Your email",
    required: true,
    input: <input className={styles.previewInput} type="email" disabled />,
  },
];

export type FormBuilderSaveData = {
  title: string;
  description: string;
  theme: FormTheme;
  fields: FormField[];
};

export default function FormBuilder({
  initialFields,
  initialTitle = "",
  initialDescription = "",
  initialTheme,
  onSave,
  saveLabel = "Save",
}: {
  initialFields: FormField[];
  initialTitle?: string;
  initialDescription?: string;
  initialTheme?: FormTheme;
  onSave: (data: FormBuilderSaveData) => Promise<{ error?: string } | void>;
  saveLabel?: string;
}) {
  const [fields, setFields] = useState<FormField[]>(initialFields);
  // Spread over DEFAULT_THEME (not just `?? DEFAULT_THEME`) so a theme saved
  // before a field existed — or a stale one from a hot-reloaded session —
  // still has every key defined, never `undefined` into a color/range input.
  const [theme, setTheme] = useState<FormTheme>({ ...DEFAULT_THEME, ...initialTheme });
  const [formTitle, setFormTitle] = useState(initialTitle);
  const [formDescription, setFormDescription] = useState(initialDescription);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFields[0]?.id ?? null,
  );
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FormFieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [newOptions, setNewOptions] = useState<string[]>([""]);
  const [addFieldError, setAddFieldError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const previewRef = useRef<HTMLDivElement>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStage, setAiStage] = useState<"idle" | "generating" | "reviewing" | "revising">(
    "idle",
  );
  const [aiRound, setAiRound] = useState(0);
  const [aiError, setAiError] = useState<string | null>(null);
  const aiRegionRef = useRef<HTMLDivElement>(null);
  useFocusTrap(aiOpen, aiRegionRef);

  const [fullScreenPreviewOpen, setFullScreenPreviewOpen] = useState(false);
  const fullScreenPreviewRef = useRef<HTMLDivElement>(null);
  useFocusTrap(fullScreenPreviewOpen, fullScreenPreviewRef);

  useEffect(() => {
    if (!fullScreenPreviewOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullScreenPreviewOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [fullScreenPreviewOpen]);

  const selectedField = fields.find((field) => field.id === selectedId) ?? null;
  const isFormEmpty = fields.length === 0 && !formTitle.trim() && !formDescription.trim();

  // Shared by the inline Preview tab and the full-screen preview overlay so
  // the two can never show different data.
  const previewFields: RenderSurfaceField[] = fields.map((field) => ({
    id: field.id,
    label: field.label,
    description: field.description,
    required: field.required,
    backgroundColor: field.backgroundColor,
    input: <FieldPreview field={field} />,
  }));
  const previewEmptyState = (
    <p className={styles.empty}>
      This form has no custom questions yet — just the name and email fields above.
    </p>
  );
  const previewFooter = (
    <button
      type="button"
      className={styles.previewSubmitButton}
      style={getSubmitButtonStyle(theme)}
      disabled
    >
      Submit
    </button>
  );

  const handleMoveField = (id: string, direction: -1 | 1) => {
    setFields((current) => {
      const index = current.findIndex((field) => field.id === id);
      const targetIndex = index + direction;
      if (index === -1 || targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!formTitle.trim()) {
      setSaveError("Give the form a title before saving.");
      return;
    }
    const invalidSelect = fields.find(
      (field) => field.type === "select" && !(field.options ?? []).some((option) => option.trim()),
    );
    if (invalidSelect) {
      setSaveError(`Add at least one option for "${invalidSelect.label || "Untitled question"}".`);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await onSave({
      title: formTitle.trim(),
      description: formDescription.trim(),
      theme,
      fields,
    });
    setSaving(false);
    if (result?.error) setSaveError(result.error);
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const trimmedOptions = newOptions.map((option) => option.trim()).filter(Boolean);
    if (newType === "select" && trimmedOptions.length === 0) {
      setAddFieldError("Add at least one option for this dropdown.");
      return;
    }
    setAddFieldError(null);

    const id = crypto.randomUUID();
    setFields((current) => [
      ...current,
      {
        id,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
        ...(newType === "select" ? { options: trimmedOptions } : {}),
      },
    ]);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setNewOptions([""]);
    setSelectedId(id);
  };

  const handleAddNewOption = () => setNewOptions((current) => [...current, ""]);

  const handleRemoveNewOption = (index: number) =>
    setNewOptions((current) => current.filter((_, i) => i !== index));

  const handleNewOptionChange = (index: number, value: string) =>
    setNewOptions((current) => current.map((option, i) => (i === index ? value : option)));

  const handleAddSelectedFieldOption = () => {
    if (!selectedField) return;
    handleUpdateSelectedField({ options: [...(selectedField.options ?? []), ""] });
  };

  const handleRemoveSelectedFieldOption = (index: number) => {
    if (!selectedField) return;
    handleUpdateSelectedField({
      options: (selectedField.options ?? []).filter((_, i) => i !== index),
    });
  };

  const handleSelectedFieldOptionChange = (index: number, value: string) => {
    if (!selectedField) return;
    const options = selectedField.options?.length ? [...selectedField.options] : [""];
    options[index] = value;
    handleUpdateSelectedField({ options });
  };

  const handleRemoveField = (id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
    setSelectedId((current) => (current === id ? null : current));
  };

  const handleUpdateSelectedField = (updates: Partial<FormField>) => {
    if (!selectedField) return;
    setFields((current) =>
      current.map((field) =>
        field.id === selectedField.id ? { ...field, ...updates } : field,
      ),
    );
  };

  const handleUpdateTheme = (updates: Partial<FormTheme>) => {
    setTheme((current) => ({ ...current, ...updates }));
  };

  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      handleUpdateTheme({ backgroundImage: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const applyAiDesign = (design: AiFormDesign) => {
    setFormTitle(design.title);
    setFormDescription(design.description);
    // backgroundImage is only ever set by the server (a verified web-search
    // result) right after the initial generation — the model itself never
    // sets it. wantsBannerImage===false is an explicit AI decision (e.g. a
    // revision round dropping an image that hurt readability) and clears it;
    // otherwise whatever was already there (a manual upload, or an image
    // carried forward from an earlier round) is preserved unchanged.
    const { wantsBannerImage, backgroundImage: aiBackgroundImage, ...themeRest } = design.theme;
    setTheme((current) => ({
      ...current,
      ...themeRest,
      backgroundImage:
        aiBackgroundImage !== undefined
          ? aiBackgroundImage
          : wantsBannerImage === false
            ? null
            : current.backgroundImage,
    }));
    setFields((current) => {
      // When editing an existing form, keep a field's original id if a
      // returned field has the same label — otherwise an unrelated field-id
      // swap on an unchanged question would sever its link to any answers
      // already submitted for it (see the id-stability comment in actions.ts).
      // A field is only matched once, so duplicate labels don't collide.
      const idByLabel = new Map(
        current.map((field) => [field.label.trim().toLowerCase(), field.id]),
      );
      return design.fields.map((field) => {
        const key = field.label.trim().toLowerCase();
        const reusedId = idByLabel.get(key);
        if (reusedId) idByLabel.delete(key);
        return { ...field, id: reusedId ?? crypto.randomUUID() };
      });
    });
    setSelectedId(null);
    setViewMode("preview"); // must be mounted to be screenshotted
    setFullScreenPreviewOpen(false); // don't let a revision land silently under an open overlay
  };

  const captureScreenshot = async (): Promise<string | null> => {
    if (!previewRef.current) return null;
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(previewRef.current, {
      backgroundColor: null,
      useCORS: true,
      scale: 1,
    });
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1] ?? null;
  };

  const handleGenerateWithAI = async () => {
    setAiError(null);
    setAiRound(0);
    setAiStage("generating");

    const priorDesign: FormBuilderSaveData | null = isFormEmpty
      ? null
      : { title: formTitle, description: formDescription, theme, fields };

    const genResult = await generateFormWithAI(aiPrompt, priorDesign);
    if ("error" in genResult) {
      setAiError(genResult.error);
      setAiStage("idle");
      return;
    }

    applyAiDesign(genResult);
    await waitForPaint();

    let currentDesign: AiFormDesign = genResult;

    for (let round = 0; round < MAX_REVISION_ROUNDS; round++) {
      setAiStage("reviewing");
      const screenshot = await captureScreenshot();
      if (!screenshot) {
        setAiError("Couldn't capture a preview of the form to review.");
        setAiStage("idle");
        return;
      }

      const reviewResult = await reviewFormScreenshotAction(aiPrompt, screenshot, currentDesign);
      if ("error" in reviewResult) {
        setAiError(reviewResult.error);
        setAiStage("idle");
        return;
      }

      if (reviewResult.approved) break;

      currentDesign = reviewResult.revisedDesign;
      setAiStage("revising");
      applyAiDesign(currentDesign);
      await waitForPaint();
      setAiRound(round + 1);
    }

    setAiStage("idle");
    setAiOpen(false);
    setAiPrompt("");
  };

  return (
    <div className={styles.builder}>
      <div className={styles.designSection}>
        <div className={styles.designSectionHeader}>
          <span className={styles.designSectionLabel}>Design</span>
          <button
            type="button"
            className={styles.aiEditButton}
            aria-label={isFormEmpty ? "Generate with AI" : "Edit with AI"}
            title={isFormEmpty ? "Generate with AI" : "Edit with AI"}
            onClick={() => setAiOpen(true)}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2.5a1 1 0 0 1 .967.744l.902 3.386a4.5 4.5 0 0 0 3.18 3.18l3.387.903a1 1 0 0 1 0 1.933l-3.386.902a4.5 4.5 0 0 0-3.18 3.18l-.903 3.387a1 1 0 0 1-1.933 0l-.902-3.386a4.5 4.5 0 0 0-3.18-3.18l-3.387-.903a1 1 0 0 1 0-1.933l3.386-.902a4.5 4.5 0 0 0 3.18-3.18l.903-3.387A1 1 0 0 1 12 2.5Z" />
            </svg>
          </button>
        </div>

        <div className={styles.themePanel}>
          <span className={styles.themeSectionLabel}>Content</span>
          <div className={styles.themeGrid}>
            <label className={styles.themeControlWide}>
              Form title
              <input
                type="text"
                className={styles.input}
                placeholder="Untitled form"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </label>

            <label className={styles.themeControlWide}>
              Form description
              <textarea
                className={styles.descriptionInput}
                placeholder="Tell people what this form is for"
                rows={2}
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </label>
          </div>
        </div>

        <div className={styles.themePanel}>
          <span className={styles.themeSectionLabel}>Background</span>
          <div className={styles.themeGrid}>
            <label className={styles.themeControl}>
              Card background color
              <input
                type="color"
                className={styles.colorInput}
                value={theme.backgroundColor}
                onChange={(e) =>
                  handleUpdateTheme({ backgroundColor: e.target.value })
                }
              />
            </label>

            <label className={styles.themeControl}>
              Page background color
              <input
                type="color"
                className={styles.colorInput}
                value={theme.pageBackgroundColor}
                onChange={(e) =>
                  handleUpdateTheme({ pageBackgroundColor: e.target.value })
                }
              />
            </label>

            <div className={styles.themeControl}>
              Page background type
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="pageBackgroundType"
                    checked={theme.pageBackgroundType === "solid"}
                    onChange={() => handleUpdateTheme({ pageBackgroundType: "solid" })}
                  />
                  Solid
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="pageBackgroundType"
                    checked={theme.pageBackgroundType === "gradient"}
                    onChange={() => handleUpdateTheme({ pageBackgroundType: "gradient" })}
                  />
                  Gradient
                </label>
              </div>
            </div>

            {theme.pageBackgroundType === "gradient" && (
              <>
                <label className={styles.themeControl}>
                  Gradient second color
                  <input
                    type="color"
                    className={styles.colorInput}
                    value={theme.pageBackgroundGradientColor}
                    onChange={(e) =>
                      handleUpdateTheme({ pageBackgroundGradientColor: e.target.value })
                    }
                  />
                </label>

                <label className={styles.themeControl}>
                  Gradient angle ({theme.pageBackgroundGradientAngle}°)
                  <input
                    type="range"
                    className={styles.rangeInput}
                    min={0}
                    max={360}
                    value={theme.pageBackgroundGradientAngle}
                    onChange={(e) =>
                      handleUpdateTheme({ pageBackgroundGradientAngle: Number(e.target.value) })
                    }
                  />
                </label>
              </>
            )}

            <label className={styles.themeControl}>
              Page background animation
              <select
                className={styles.select}
                value={theme.pageBackgroundAnimation}
                onChange={(e) =>
                  handleUpdateTheme({
                    pageBackgroundAnimation: e.target.value as FormTheme["pageBackgroundAnimation"],
                  })
                }
              >
                <option value="none">None</option>
                <option value="gradientShift">Gradient shift</option>
                <option value="drift">Drift</option>
                <option value="pulse">Pulse</option>
              </select>
            </label>

            <label className={styles.themeControl}>
              Font size ({theme.fontSize}px)
              <input
                type="range"
                className={styles.rangeInput}
                min={12}
                max={22}
                value={theme.fontSize}
                onChange={(e) =>
                  handleUpdateTheme({ fontSize: Number(e.target.value) })
                }
              />
            </label>

            <label className={styles.themeControl}>
              Question background color
              <input
                type="color"
                className={styles.colorInput}
                value={theme.questionBackgroundColor}
                onChange={(e) =>
                  handleUpdateTheme({ questionBackgroundColor: e.target.value })
                }
              />
            </label>

            <label className={styles.themeControl}>
              Question transparency ({Math.round(theme.cardOpacity * 100)}%)
              <input
                type="range"
                className={styles.rangeInput}
                min={0}
                max={100}
                value={Math.round(theme.cardOpacity * 100)}
                onChange={(e) =>
                  handleUpdateTheme({ cardOpacity: Number(e.target.value) / 100 })
                }
              />
            </label>

            <div className={styles.themeControl}>
              Background style
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="backgroundMode"
                    checked={theme.backgroundMode === "banner"}
                    onChange={() => handleUpdateTheme({ backgroundMode: "banner" })}
                  />
                  Banner
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="backgroundMode"
                    checked={theme.backgroundMode === "full"}
                    onChange={() => handleUpdateTheme({ backgroundMode: "full" })}
                  />
                  Full background
                </label>
              </div>
            </div>

            {theme.backgroundMode === "banner" && (
              <label className={styles.themeControl}>
                Banner height ({theme.bannerHeight}px)
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={80}
                  max={1000}
                  value={theme.bannerHeight}
                  onChange={(e) =>
                    handleUpdateTheme({ bannerHeight: Number(e.target.value) })
                  }
                />
              </label>
            )}

            <label className={styles.themeControl}>
              Background image
              <span className={styles.fileButton}>
                {theme.backgroundImage ? "Change image" : "Choose image"}
                <input
                  type="file"
                  accept="image/*"
                  className={styles.fileInput}
                  onChange={handleBackgroundImageUpload}
                />
              </span>
            </label>

            {theme.backgroundImage && (
              <div className={styles.themeControl}>
                &nbsp;
                <button
                  type="button"
                  className={styles.removeButtonInline}
                  onClick={() => handleUpdateTheme({ backgroundImage: null })}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>
        </div>

        <div className={styles.themePanelGroup}>
          <div className={styles.themePanel}>
            <span className={styles.themeSectionLabel}>Title</span>
            <div className={styles.themeGrid}>
              <label className={styles.themeControl}>
                Font
                <select
                  className={styles.select}
                  value={theme.titleFont}
                  onChange={(e) =>
                    handleUpdateTheme({ titleFont: e.target.value as FontOption })
                  }
                >
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>

              <label className={styles.themeControl}>
                Color
                <input
                  type="color"
                  className={styles.colorInput}
                  value={theme.titleColor}
                  onChange={(e) => handleUpdateTheme({ titleColor: e.target.value })}
                />
              </label>

              <label className={styles.themeControl}>
                Size ({theme.titleSize}px)
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={16}
                  max={500}
                  value={theme.titleSize}
                  onChange={(e) =>
                    handleUpdateTheme({ titleSize: Number(e.target.value) })
                  }
                />
              </label>

              <label className={styles.themeControl}>
                Margin bottom ({theme.titleMarginBottom}px)
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={0}
                  max={100}
                  value={theme.titleMarginBottom}
                  onChange={(e) =>
                    handleUpdateTheme({ titleMarginBottom: Number(e.target.value) })
                  }
                />
              </label>
            </div>
          </div>

          <div className={styles.themePanel}>
            <span className={styles.themeSectionLabel}>Description</span>
            <div className={styles.themeGrid}>
              <label className={styles.themeControl}>
                Font
                <select
                  className={styles.select}
                  value={theme.descriptionFont}
                  onChange={(e) =>
                    handleUpdateTheme({
                      descriptionFont: e.target.value as FontOption,
                    })
                  }
                >
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>

              <label className={styles.themeControl}>
                Color
                <input
                  type="color"
                  className={styles.colorInput}
                  value={theme.descriptionColor}
                  onChange={(e) =>
                    handleUpdateTheme({ descriptionColor: e.target.value })
                  }
                />
              </label>

              <label className={styles.themeControl}>
                Size ({theme.descriptionSize}px)
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={12}
                  max={500}
                  value={theme.descriptionSize}
                  onChange={(e) =>
                    handleUpdateTheme({ descriptionSize: Number(e.target.value) })
                  }
                />
              </label>

              <label className={styles.themeControl}>
                Margin bottom ({theme.descriptionMarginBottom}px)
                <input
                  type="range"
                  className={styles.rangeInput}
                  min={0}
                  max={100}
                  value={theme.descriptionMarginBottom}
                  onChange={(e) =>
                    handleUpdateTheme({
                      descriptionMarginBottom: Number(e.target.value),
                    })
                  }
                />
              </label>
            </div>
          </div>

          <div className={styles.themePanel}>
            <span className={styles.themeSectionLabel}>Submit Button</span>
            <div className={styles.themeGrid}>
              <label className={styles.themeControl}>
                Font
                <select
                  className={styles.select}
                  value={theme.submitButtonFont}
                  onChange={(e) =>
                    handleUpdateTheme({ submitButtonFont: e.target.value as FontOption })
                  }
                >
                  <option value="sans">Sans-serif</option>
                  <option value="serif">Serif</option>
                  <option value="mono">Monospace</option>
                </select>
              </label>

              <label className={styles.themeControl}>
                Background color
                <input
                  type="color"
                  className={styles.colorInput}
                  value={theme.submitButtonBackgroundColor}
                  onChange={(e) =>
                    handleUpdateTheme({ submitButtonBackgroundColor: e.target.value })
                  }
                />
              </label>

              <div className={styles.themeControl}>
                Button type
                <div className={styles.radioGroup}>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="submitButtonStyle"
                      checked={theme.submitButtonStyle === "solid"}
                      onChange={() => handleUpdateTheme({ submitButtonStyle: "solid" })}
                    />
                    Solid
                  </label>
                  <label className={styles.radioOption}>
                    <input
                      type="radio"
                      name="submitButtonStyle"
                      checked={theme.submitButtonStyle === "outline"}
                      onChange={() => handleUpdateTheme({ submitButtonStyle: "outline" })}
                    />
                    Outline
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.viewToggle} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "preview"}
            className={`${styles.toggleButton} ${viewMode === "preview" ? styles.toggleButtonActive : ""}`}
            onClick={() => setViewMode("preview")}
          >
            Preview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "edit"}
            className={`${styles.toggleButton} ${viewMode === "edit" ? styles.toggleButtonActive : ""}`}
            onClick={() => setViewMode("edit")}
          >
            Customize
          </button>
        </div>

        <button
          type="button"
          className={styles.removeButtonInline}
          onClick={() => setFullScreenPreviewOpen(true)}
        >
          Full-Screen Preview
        </button>
      </div>

      {viewMode === "preview" ? (
        <div className={styles.previewFrame}>
          <FormRenderSurface
            surfaceRef={previewRef}
            name={formTitle}
            description={formDescription}
            theme={theme}
            chrome={PREVIEW_CHROME}
            fields={previewFields}
            emptyState={previewEmptyState}
            footer={previewFooter}
          />
        </div>
      ) : (
        <div className={styles.customizeLayout}>
          <div className={styles.customizeColumn}>
          <span className={styles.customizeColumnLabel}>Questions</span>
          <ul className={styles.questionList}>
            {fields.map((field, index) => (
              <li
                key={field.id}
                className={`${styles.questionItem} ${
                  field.id === selectedId ? styles.questionItemActive : ""
                }`}
              >
                <div className={styles.reorderButtons}>
                  <button
                    type="button"
                    className={styles.reorderButton}
                    onClick={() => handleMoveField(field.id, -1)}
                    disabled={index === 0}
                    aria-label={`Move ${field.label} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className={styles.reorderButton}
                    onClick={() => handleMoveField(field.id, 1)}
                    disabled={index === fields.length - 1}
                    aria-label={`Move ${field.label} down`}
                  >
                    ↓
                  </button>
                </div>
                <button
                  type="button"
                  className={styles.questionItemSelect}
                  onClick={() => setSelectedId(field.id)}
                >
                  <span className={styles.fieldLabel}>{field.label.trim() || "Untitled question"}</span>
                  <span className={styles.fieldMeta}>
                    {FIELD_TYPE_LABELS[field.type]}
                    {field.required ? " · Required" : ""}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles.removeButtonIcon}
                  onClick={() => handleRemoveField(field.id)}
                  aria-label={`Remove ${field.label}`}
                >
                  ×
                </button>
              </li>
            ))}
            {fields.length === 0 && (
              <li className={styles.empty}>No fields yet.</li>
            )}
          </ul>
          </div>

          <div className={styles.customizeColumn}>
          <span className={styles.customizeColumnLabel}>Question Settings</span>
          <div className={styles.customizePanel}>
            {selectedField ? (
              <>
                <label className={styles.panelFieldLabel}>
                  Label
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedField.label}
                    onChange={(e) =>
                      handleUpdateSelectedField({ label: e.target.value })
                    }
                  />
                </label>

                <label className={styles.panelFieldLabel}>
                  Description (optional)
                  <textarea
                    className={styles.descriptionInput}
                    rows={2}
                    placeholder="Add helper text for this question"
                    value={selectedField.description ?? ""}
                    onChange={(e) =>
                      handleUpdateSelectedField({ description: e.target.value })
                    }
                  />
                </label>

                <label className={styles.panelFieldLabel}>
                  Type
                  <select
                    className={styles.select}
                    value={selectedField.type}
                    onChange={(e) =>
                      handleUpdateSelectedField({
                        type: e.target.value as FormFieldType,
                      })
                    }
                  >
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                {selectedField.type === "select" && (
                  <label className={styles.panelFieldLabel}>
                    Options
                    <div className={styles.optionsEditor}>
                      {(selectedField.options?.length ? selectedField.options : [""]).map(
                        (option, index) => (
                          <div key={index} className={styles.optionRow}>
                            <input
                              type="text"
                              className={styles.input}
                              placeholder={`Option ${index + 1}`}
                              value={option}
                              onChange={(e) =>
                                handleSelectedFieldOptionChange(index, e.target.value)
                              }
                            />
                            <button
                              type="button"
                              className={styles.removeButtonIcon}
                              onClick={() => handleRemoveSelectedFieldOption(index)}
                              disabled={(selectedField.options?.length ?? 1) <= 1}
                              aria-label={`Remove option ${index + 1}`}
                            >
                              ×
                            </button>
                          </div>
                        ),
                      )}
                      <button
                        type="button"
                        className={styles.removeButtonInline}
                        onClick={handleAddSelectedFieldOption}
                      >
                        Add Option
                      </button>
                    </div>
                  </label>
                )}

                <label className={styles.requiredLabel}>
                  <input
                    type="checkbox"
                    checked={selectedField.required}
                    onChange={(e) =>
                      handleUpdateSelectedField({ required: e.target.checked })
                    }
                  />
                  Required
                </label>

                <label className={styles.panelFieldLabel}>
                  Background color
                  <div className={styles.colorRow}>
                    <input
                      type="color"
                      className={styles.colorInput}
                      value={
                        selectedField.backgroundColor ??
                        theme.questionBackgroundColor
                      }
                      onChange={(e) =>
                        handleUpdateSelectedField({
                          backgroundColor: e.target.value,
                        })
                      }
                    />
                    {selectedField.backgroundColor && (
                      <button
                        type="button"
                        className={styles.removeButtonInline}
                        onClick={() =>
                          handleUpdateSelectedField({ backgroundColor: undefined })
                        }
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </label>
              </>
            ) : (
              <p className={styles.empty}>Select a question to customize it.</p>
            )}
          </div>

          <div className={styles.addFormCard}>
            <span className={styles.addFormLabel}>Add a Question</span>
            <form className={styles.addForm} onSubmit={handleAddField}>
              <input
                type="text"
                className={styles.input}
                placeholder="New question label"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
              />

              <select
                className={styles.select}
                value={newType}
                onChange={(e) => setNewType(e.target.value as FormFieldType)}
              >
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              <label className={styles.requiredLabel}>
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(e) => setNewRequired(e.target.checked)}
                />
                Required
              </label>

              {newType === "select" && (
                <div className={styles.optionsEditor}>
                  {newOptions.map((option, index) => (
                    <div key={index} className={styles.optionRow}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => handleNewOptionChange(index, e.target.value)}
                      />
                      <button
                        type="button"
                        className={styles.removeButtonIcon}
                        onClick={() => handleRemoveNewOption(index)}
                        disabled={newOptions.length === 1}
                        aria-label={`Remove option ${index + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={styles.removeButtonInline}
                    onClick={handleAddNewOption}
                  >
                    Add Option
                  </button>
                </div>
              )}

              {addFieldError && <span className={styles.optionsError}>{addFieldError}</span>}

              <button type="submit" className={styles.addButton}>
                Add Question
              </button>
            </form>
          </div>
          </div>
        </div>
      )}

      <div className={styles.saveBar}>
        {saveError && <span className={styles.saveError}>{saveError}</span>}
        <button
          type="button"
          className={styles.saveButton}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving…" : saveLabel}
        </button>
      </div>

      <div ref={aiRegionRef} tabIndex={-1}>
        <Modal
          open={aiOpen}
          onClose={() => aiStage === "idle" && setAiOpen(false)}
          title={isFormEmpty ? "Generate with AI" : "Edit with AI"}
        >
          <div className={sharedStyles.form}>
            <div className={sharedStyles.field}>
              <label className={sharedStyles.label} htmlFor="ai_form_prompt">
                {isFormEmpty ? "Describe the form you want" : "Describe what you'd like to change"}
              </label>
              <textarea
                id="ai_form_prompt"
                className={sharedStyles.textarea}
                rows={4}
                placeholder={
                  isFormEmpty
                    ? "A volunteer sign-up form with a warm, friendly look — ask for name, email, phone, and t-shirt size"
                    : "Add a phone number field, and make the title bigger"
                }
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={aiStage !== "idle"}
              />
            </div>
            {aiError && <p className={sharedStyles.error}>{aiError}</p>}
            <div className={sharedStyles.actions}>
              <button
                type="button"
                className={sharedStyles.primaryButton}
                disabled={aiStage !== "idle" || !aiPrompt.trim()}
                onClick={handleGenerateWithAI}
              >
                {aiStage === "idle" ? (isFormEmpty ? "Generate" : "Apply Changes") : "Working…"}
              </button>
            </div>
          </div>
        </Modal>

        {aiStage !== "idle" && (
          <AiGeneratingOverlay
            message={
              aiStage === "generating"
                ? isFormEmpty
                  ? "Designing your form…"
                  : "Updating your form…"
                : aiStage === "reviewing"
                  ? "Checking how it looks…"
                  : `Refining the design… (round ${aiRound} of ${MAX_REVISION_ROUNDS})`
            }
          />
        )}
      </div>

      {fullScreenPreviewOpen && (
        <div
          ref={fullScreenPreviewRef}
          className={`${styles.fullscreenOverlay} ${getPageBackgroundAnimationClass(theme)}`}
          style={getPageBackgroundStyle(theme)}
          role="dialog"
          aria-modal="true"
          aria-label="Full-screen preview"
        >
          <button
            type="button"
            className={styles.fullscreenClose}
            aria-label="Close preview"
            onClick={() => setFullScreenPreviewOpen(false)}
          >
            ×
          </button>
          <div className={styles.fullscreenFrame}>
            <FormRenderSurface
              name={formTitle}
              description={formDescription}
              theme={theme}
              chrome={PREVIEW_CHROME}
              fields={previewFields}
              emptyState={previewEmptyState}
              footer={previewFooter}
            />
          </div>
        </div>
      )}
    </div>
  );
}
