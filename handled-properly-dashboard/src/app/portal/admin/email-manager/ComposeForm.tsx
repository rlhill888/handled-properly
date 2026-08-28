"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { sendMassEmail, type ActionState } from "./actions";
import { saveEmailTemplate } from "./templates-actions";
import { draftEmailWithAI } from "./ai-actions";
import SubmitButton from "@/components/portal/SubmitButton";
import Modal from "@/components/portal/Modal";
import styles from "@/styles/admin-shared.module.css";

type Category = { id: string; name: string };
type EventOption = { id: string; name: string };
type FormTemplateOption = { id: string; name: string };
type ContactPreview = {
  id: string;
  categoryIds: string[];
  staffEventIds: string[];
  attendeeEventIds: string[];
};

type BodyTab = "compose" | "html" | "preview";

export default function ComposeForm({
  categories,
  contacts,
  events,
  formTemplates,
  initialSubject = "",
  initialBody = "",
}: {
  categories: Category[];
  contacts: ContactPreview[];
  events: EventOption[];
  formTemplates: FormTemplateOption[];
  initialSubject?: string;
  initialBody?: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(sendMassEmail, null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventFilterType, setEventFilterType] = useState<"staff" | "attendees">("staff");
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBody);
  const [bodyTab, setBodyTab] = useState<BodyTab>("compose");
  const [isAiDraft, setIsAiDraft] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // contentEditable is uncontrolled by nature — syncing bodyHtml into it on
  // every keystroke would fight the cursor. Instead we only push state INTO
  // the DOM when the Compose tab becomes active (tab switch, AI draft,
  // template load); typing inside it just flows state OUT via onInput.
  useEffect(() => {
    if (bodyTab === "compose" && bodyRef.current) {
      bodyRef.current.innerHTML = bodyHtml;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyTab]);

  const syncFromEditor = () => {
    if (!bodyRef.current) return;
    setBodyHtml(bodyRef.current.innerHTML);
    setIsAiDraft(false);
  };

  const insertImage = (dataUrl: string) => {
    bodyRef.current?.focus();
    document.execCommand("insertHTML", false, `<img src="${dataUrl}" style="max-width:100%;" />`);
    syncFromEditor();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        const reader = new FileReader();
        reader.onload = () => insertImage(reader.result as string);
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => insertImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleGenerateWithAI = async () => {
    setAiDrafting(true);
    setAiError(null);
    const result = await draftEmailWithAI(aiPrompt);
    setAiDrafting(false);
    if ("error" in result) {
      setAiError(result.error);
      return; // manually-entered subject/body, if any, are left untouched
    }
    setSubject(result.subject);
    setBodyHtml(result.bodyHtml);
    setIsAiDraft(true);
    setBodyTab("compose");
    if (bodyRef.current) bodyRef.current.innerHTML = result.bodyHtml;
    setAiOpen(false);
    setAiPrompt("");
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setTemplateMessage("Name the template first.");
      return;
    }
    setTemplateSaving(true);
    setTemplateMessage(null);
    const result = await saveEmailTemplate(
      templateName,
      subject,
      bodyHtml,
      isAiDraft ? "ai_draft" : "manual"
    );
    setTemplateSaving(false);
    if (result?.error) {
      setTemplateMessage(result.error);
      return;
    }
    setTemplateName("");
    setTemplateMessage("Saved.");
  };

  const filteredCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, categorySearch]);

  const recipientCount = useMemo(() => {
    let matches = contacts;

    if (selectedCategoryIds.length > 0) {
      matches = matches.filter((c) => c.categoryIds.some((id) => selectedCategoryIds.includes(id)));
    }

    if (eventId) {
      matches = matches.filter((c) =>
        eventFilterType === "staff"
          ? c.staffEventIds.includes(eventId)
          : c.attendeeEventIds.includes(eventId)
      );
    }

    return matches.length;
  }, [contacts, selectedCategoryIds, eventId, eventFilterType]);

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((current) =>
      current.includes(id) ? current.filter((c) => c !== id) : [...current, id]
    );
  };

  return (
    <form action={formAction} className={styles.form}>
      <div className={styles.viewToggle} role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={bodyTab === "compose"}
          className={`${styles.toggleButton} ${bodyTab === "compose" ? styles.toggleButtonActive : ""}`}
          onClick={() => setBodyTab("compose")}
        >
          Compose
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={bodyTab === "html"}
          className={`${styles.toggleButton} ${bodyTab === "html" ? styles.toggleButtonActive : ""}`}
          onClick={() => setBodyTab("html")}
        >
          HTML
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={bodyTab === "preview"}
          className={`${styles.toggleButton} ${bodyTab === "preview" ? styles.toggleButtonActive : ""}`}
          onClick={() => setBodyTab("preview")}
        >
          Preview
        </button>
      </div>

      <h2 className={styles.cardTitle}>Compose</h2>

      {state && "error" in state && <p className={styles.error}>{state.error}</p>}
      {state && "success" in state && (
        <p className={styles.description} style={{ color: "#0a7c2f" }}>
          {state.success}
        </p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="subject">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          required
          className={styles.input}
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setIsAiDraft(false);
          }}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Body</label>

        {bodyTab === "compose" && (
          <div
            ref={bodyRef}
            className={styles.richBody}
            contentEditable
            suppressContentEditableWarning
            onInput={syncFromEditor}
            onPaste={handlePaste}
            data-placeholder="Write your email…"
          />
        )}

        {bodyTab === "html" && (
          <textarea
            className={styles.textarea}
            style={{ minHeight: 220, fontFamily: "monospace" }}
            placeholder="<p>Hi there,</p>"
            value={bodyHtml}
            onChange={(e) => {
              setBodyHtml(e.target.value);
              setIsAiDraft(false);
            }}
          />
        )}

        {bodyTab === "preview" && (
          <iframe
            title="Email preview"
            className={styles.previewFrame}
            srcDoc={bodyHtml || "<p style='color:#999;font-family:sans-serif'>Nothing to preview yet.</p>"}
          />
        )}

        <input type="hidden" name="body_html" value={bodyHtml} />
        {isAiDraft && <p className={styles.description}>AI-drafted — review before sending.</p>}

        <div className={styles.composeToolbar}>
          <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
          <label className={styles.attachButton} aria-label="Attach a file">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13"
              />
            </svg>
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleAttachImage} />
          </label>
        </div>
      </div>

      <div className={styles.field}>
        <div className={styles.cardHeaderRow} style={{ marginBottom: 0 }}>
          <span className={styles.label} style={{ marginBottom: 0 }}>
            Recipients
          </span>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => setFiltersOpen(true)}
          >
            Filter Recipients
          </button>
        </div>
        <p className={styles.description}>
          This will send to <strong>{recipientCount}</strong> recipient
          {recipientCount === 1 ? "" : "s"}
          {selectedCategoryIds.length > 0 || eventId ? " (filtered)" : ""}.
        </p>
      </div>

      {selectedCategoryIds.map((id) => (
        <input key={id} type="hidden" name="category_ids" value={id} />
      ))}
      {eventId && <input type="hidden" name="event_id" value={eventId} />}
      {eventId && <input type="hidden" name="event_filter_type" value={eventFilterType} />}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="form_template_id">
          Attach a fillable form <span className={styles.optional}>(optional — a fill link is appended to the email)</span>
        </label>
        <select id="form_template_id" name="form_template_id" defaultValue="" className={styles.select}>
          <option value="">No form attached</option>
          {formTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.actions}>
        <button type="button" className={styles.secondaryButton} onClick={() => setAiOpen(true)}>
          Generate with AI
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => {
            setTemplateMessage(null);
            setTemplateOpen(true);
          }}
        >
          Save as Template
        </button>
      </div>

      <Modal open={aiOpen} onClose={() => setAiOpen(false)} title="Generate with AI">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="ai_prompt">
              Describe the email you want
            </label>
            <textarea
              id="ai_prompt"
              className={styles.textarea}
              rows={3}
              placeholder="Remind staff about Saturday's 8am setup call"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
          </div>
          {aiError && <p className={styles.error}>{aiError}</p>}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={aiDrafting || !aiPrompt.trim()}
              onClick={handleGenerateWithAI}
            >
              {aiDrafting ? "Drafting…" : "Generate"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={templateOpen} onClose={() => setTemplateOpen(false)} title="Save as Template">
        <div className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="template_name">
              Template name
            </label>
            <input
              id="template_name"
              className={styles.input}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g. Setup Reminder"
            />
          </div>
          {templateMessage && (
            <p className={templateMessage === "Saved." ? styles.description : styles.error}>
              {templateMessage}
            </p>
          )}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={templateSaving}
              onClick={handleSaveTemplate}
            >
              {templateSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filter Recipients">
        <div className={styles.form}>
          <div className={styles.field}>
            <span className={styles.label}>
              Category <span className={styles.optional}>(none = everyone)</span>
            </span>
            {categories.length > 5 && (
              <input
                type="search"
                className={styles.searchInput}
                style={{ marginBottom: 8 }}
                placeholder="Search categories…"
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
              />
            )}
            <div className={styles.metaRow}>
              {categories.length === 0 && (
                <span className={styles.emptyState}>No categories yet.</span>
              )}
              {categories.length > 0 && filteredCategories.length === 0 && (
                <span className={styles.emptyState}>No categories match.</span>
              )}
              {filteredCategories.map((category) => (
                <label key={category.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={() => toggleCategory(category.id)}
                  />
                  {category.name}
                </label>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <span className={styles.label}>
              Event <span className={styles.optional}>(optional, combines with category filter)</span>
            </span>
            <div className={styles.formRow}>
              <select
                className={styles.select}
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
              >
                <option value="">No event filter</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
              {eventId && (
                <select
                  className={styles.select}
                  value={eventFilterType}
                  onChange={(e) => setEventFilterType(e.target.value as "staff" | "attendees")}
                >
                  <option value="staff">Staff on this event</option>
                  <option value="attendees">Attendees of this event</option>
                </select>
              )}
            </div>
          </div>

          <p className={styles.description}>
            Matches <strong>{recipientCount}</strong> recipient{recipientCount === 1 ? "" : "s"}.
          </p>

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setFiltersOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </form>
  );
}
