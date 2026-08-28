"use client";

import { useState } from "react";
import styles from "./FormBuilder.module.css";

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
};

type BackgroundMode = "banner" | "full";

const FONT_OPTIONS = {
  sans: "var(--font-geist-sans), system-ui, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "var(--font-geist-mono), monospace",
} as const;

type FontOption = keyof typeof FONT_OPTIONS;

export type FormTheme = {
  backgroundColor: string;
  fontSize: number;
  cardOpacity: number;
  backgroundImage: string | null;
  backgroundMode: BackgroundMode;
  bannerHeight: number;
  questionBackgroundColor: string;
  titleFont: FontOption;
  titleColor: string;
  titleSize: number;
  titleMarginBottom: number;
  descriptionFont: FontOption;
  descriptionColor: string;
  descriptionSize: number;
  descriptionMarginBottom: number;
};

export const DEFAULT_THEME: FormTheme = {
  backgroundColor: "#f5f5f5",
  fontSize: 14,
  cardOpacity: 1,
  backgroundImage: null,
  backgroundMode: "banner",
  bannerHeight: 140,
  questionBackgroundColor: "#ffffff",
  titleFont: "sans",
  titleColor: "#ffffff",
  titleSize: 24,
  titleMarginBottom: 0,
  descriptionFont: "sans",
  descriptionColor: "#000000",
  descriptionSize: 16,
  descriptionMarginBottom: 0,
};

function hexToRgba(hex: string, alpha: number) {
  const normalized = hex.replace("#", "");
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

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
    return (
      <select className={styles.previewInput} disabled defaultValue="">
        <option value="" disabled>
          Select an option…
        </option>
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
  const [theme, setTheme] = useState<FormTheme>(initialTheme ?? DEFAULT_THEME);
  const [formTitle, setFormTitle] = useState(initialTitle);
  const [formDescription, setFormDescription] = useState(initialDescription);
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFields[0]?.id ?? null,
  );
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState<FormFieldType>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedField = fields.find((field) => field.id === selectedId) ?? null;

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

    const id = crypto.randomUUID();
    setFields((current) => [
      ...current,
      {
        id,
        label: newLabel.trim(),
        type: newType,
        required: newRequired,
      },
    ]);
    setNewLabel("");
    setNewType("text");
    setNewRequired(false);
    setSelectedId(id);
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

  return (
    <div className={styles.builder}>
      <div className={styles.designSection}>
        <span className={styles.designSectionLabel}>Design</span>

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
              Background color
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
        </div>
      </div>

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

      {viewMode === "preview" ? (
        <div
          className={styles.previewSurface}
          style={{
            fontSize: `${theme.fontSize}px`,
            backgroundColor: theme.backgroundColor,
            backgroundImage:
              theme.backgroundMode === "full" && theme.backgroundImage
                ? `url(${theme.backgroundImage})`
                : undefined,
          }}
        >
          {theme.backgroundMode === "banner" &&
            (formTitle || theme.backgroundImage) && (
              <div
                className={styles.previewBanner}
                style={{
                  minHeight: `${theme.bannerHeight}px`,
                  backgroundImage: theme.backgroundImage
                    ? `url(${theme.backgroundImage})`
                    : undefined,
                }}
              >
                {formTitle && (
                  <h2
                    className={styles.previewTitle}
                    style={{
                      fontFamily: FONT_OPTIONS[theme.titleFont],
                      color: theme.titleColor,
                      fontSize: `${theme.titleSize}px`,
                      marginBottom: `${theme.titleMarginBottom}px`,
                    }}
                  >
                    {formTitle}
                  </h2>
                )}
              </div>
            )}

          <div className={styles.previewContent}>
            {theme.backgroundMode === "full" && formTitle && (
              <h2
                className={styles.previewTitleFull}
                style={{
                  fontFamily: FONT_OPTIONS[theme.titleFont],
                  color: theme.titleColor,
                  fontSize: `${theme.titleSize}px`,
                  marginBottom: `${theme.titleMarginBottom}px`,
                }}
              >
                {formTitle}
              </h2>
            )}

            {formDescription && (
              <div
                className={styles.descriptionCard}
                style={{
                  backgroundColor: hexToRgba(
                    theme.questionBackgroundColor,
                    theme.cardOpacity,
                  ),
                }}
              >
                <p
                  className={styles.previewDescription}
                  style={{
                    fontFamily: FONT_OPTIONS[theme.descriptionFont],
                    color: theme.descriptionColor,
                    fontSize: `${theme.descriptionSize}px`,
                    marginBottom: `${theme.descriptionMarginBottom}px`,
                  }}
                >
                  {formDescription}
                </p>
              </div>
            )}

            <ul className={styles.fieldList}>
              {fields.map((field) => (
                <li
                  key={field.id}
                  className={styles.field}
                  style={{
                    backgroundColor: hexToRgba(
                      field.backgroundColor ?? theme.questionBackgroundColor,
                      theme.cardOpacity,
                    ),
                  }}
                >
                  <label className={styles.previewLabel}>
                    {field.label}
                    {field.required && (
                      <span className={styles.requiredMark}>*</span>
                    )}
                  </label>
                  {field.description && (
                    <p className={styles.previewFieldDescription}>
                      {field.description}
                    </p>
                  )}
                  <FieldPreview field={field} />
                </li>
              ))}
              {fields.length === 0 && (
                <li className={styles.emptyPreview}>
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="4 3" />
                  </svg>
                  <span className={styles.emptyPreviewText}>
                    The preview can&apos;t render yet
                  </span>
                  <span className={styles.emptyPreviewSubtext}>
                    Add at least one field below to continue.
                  </span>
                </li>
              )}
            </ul>
          </div>
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
                  <span className={styles.fieldLabel}>{field.label}</span>
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
    </div>
  );
}
