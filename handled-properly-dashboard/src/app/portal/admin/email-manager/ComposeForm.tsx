"use client";

import { useActionState, useMemo, useState } from "react";
import { sendMassEmail, type ActionState } from "./actions";
import { saveEmailTemplate } from "./templates-actions";
import { draftEmailWithAI } from "./ai-actions";
import SubmitButton from "@/components/portal/SubmitButton";
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
  const [eventId, setEventId] = useState("");
  const [eventFilterType, setEventFilterType] = useState<"staff" | "attendees">("staff");
  const [subject, setSubject] = useState(initialSubject);
  const [bodyHtml, setBodyHtml] = useState(initialBody);
  const [templateName, setTemplateName] = useState("");
  const [templateSaving, setTemplateSaving] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiDrafting, setAiDrafting] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiDraft, setIsAiDraft] = useState(false);

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
  };

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
      {state && "error" in state && <p className={styles.error}>{state.error}</p>}
      {state && "success" in state && (
        <p className={styles.description} style={{ color: "#0a7c2f" }}>
          {state.success}
        </p>
      )}

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ai_prompt">
          Draft with AI <span className={styles.optional}>(optional — describe what you want)</span>
        </label>
        <div className={styles.formRow}>
          <input
            id="ai_prompt"
            className={styles.input}
            placeholder="Remind staff about Saturday's 8am setup call"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
          />
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={aiDrafting || !aiPrompt.trim()}
            onClick={handleGenerateWithAI}
          >
            {aiDrafting ? "Drafting…" : "Generate"}
          </button>
        </div>
        {aiError && <p className={styles.error}>{aiError}</p>}
        {isAiDraft && !aiError && (
          <p className={styles.description}>
            AI-drafted — review and edit below before sending.
          </p>
        )}
      </div>

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
        <label className={styles.label} htmlFor="body_html">
          Body (HTML)
        </label>
        <textarea
          id="body_html"
          name="body_html"
          required
          className={styles.textarea}
          style={{ minHeight: 200, fontFamily: "monospace" }}
          placeholder="<p>Hi there,</p>"
          value={bodyHtml}
          onChange={(e) => {
            setBodyHtml(e.target.value);
            setIsAiDraft(false);
          }}
        />
      </div>

      <div className={styles.formRow}>
        <input
          className={styles.input}
          placeholder="Template name to save this as…"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
        />
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={templateSaving}
          onClick={handleSaveTemplate}
        >
          {templateSaving ? "Saving…" : "Save as Template"}
        </button>
      </div>
      {templateMessage && <p className={styles.description}>{templateMessage}</p>}

      <div className={styles.field}>
        <span className={styles.label}>
          Category filter <span className={styles.optional}>(none = everyone)</span>
        </span>
        <div className={styles.metaRow}>
          {categories.length === 0 && (
            <span className={styles.emptyState}>No categories yet.</span>
          )}
          {categories.map((category) => (
            <label key={category.id} className={styles.checkboxRow}>
              <input
                type="checkbox"
                name="category_ids"
                value={category.id}
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
          Event filter <span className={styles.optional}>(optional, combines with category filter)</span>
        </span>
        <div className={styles.formRow}>
          <select
            className={styles.select}
            name="event_id"
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
              name="event_filter_type"
              value={eventFilterType}
              onChange={(e) => setEventFilterType(e.target.value as "staff" | "attendees")}
            >
              <option value="staff">Staff on this event</option>
              <option value="attendees">Attendees of this event</option>
            </select>
          )}
        </div>
      </div>

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

      <p className={styles.description}>
        This will send to <strong>{recipientCount}</strong> recipient
        {recipientCount === 1 ? "" : "s"}.
      </p>

      <div className={styles.actions}>
        <SubmitButton pendingLabel="Sending…">Send</SubmitButton>
      </div>
    </form>
  );
}
