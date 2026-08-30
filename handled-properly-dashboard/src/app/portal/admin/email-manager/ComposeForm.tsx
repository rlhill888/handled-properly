"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { sendMassEmail, type ActionState } from "./actions";
import { generateEmailHtmlWithAI } from "./ai-actions";
import SubmitButton from "@/components/portal/SubmitButton";
import Modal from "@/components/portal/Modal";
import SelectDropdown from "@/components/portal/SelectDropdown";
import AiGeneratingOverlay from "@/components/AiGeneratingOverlay";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import styles from "@/styles/admin-shared.module.css";

// `caretRangeFromPoint` (Chrome/Safari) and `caretPositionFromPoint`
// (Firefox) are the two non-overlapping ways browsers expose "what's the
// text position under this pixel" — needed to drop an image where the
// pointer actually is, since a drop event carries no selection of its own.
function caretRangeFromPoint(x: number, y: number): Range | null {
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y);
  }
  const legacyDocument = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
  };
  const position = legacyDocument.caretPositionFromPoint?.(x, y);
  if (!position) return null;
  const range = document.createRange();
  range.setStart(position.offsetNode, position.offset);
  range.collapse(true);
  return range;
}

type UploadedPhoto = { dataUrl: string; name: string };

type Category = { id: string; name: string };
type EventOption = { id: string; name: string };
type FormOption = { id: string; name: string };
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
  availableForms,
}: {
  categories: Category[];
  contacts: ContactPreview[];
  events: EventOption[];
  availableForms: FormOption[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(sendMassEmail, null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventFilterType, setEventFilterType] = useState<"staff" | "attendees">("staff");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [formId, setFormId] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  // Opening the native file picker steals focus/selection from the body
  // before the file is even chosen, so by the time handleAttachImage runs
  // there's nothing left to insert at. Captured on mousedown — just before
  // the picker opens — so the cursor position survives the round trip.
  const attachImageRangeRef = useRef<Range | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);

  const [aiHtmlOpen, setAiHtmlOpen] = useState(false);
  const [designBrief, setDesignBrief] = useState("");
  const [contentDetails, setContentDetails] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [aiStage, setAiStage] = useState<"idle" | "generating" | "revising">("idle");
  const [aiError, setAiError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  // The AI's own last output, with {{PHOTO_n}}/{{FILL_LINK}} placeholders
  // still literally present — used as context for follow-up revisions, so
  // the (potentially huge) base64 photo data embedded in previewHtml is
  // never sent back to the model.
  const [lastGeneratedHtml, setLastGeneratedHtml] = useState<string | null>(null);
  const [followUpInstruction, setFollowUpInstruction] = useState("");
  const aiRegionRef = useRef<HTMLDivElement>(null);
  useFocusTrap(aiHtmlOpen, aiRegionRef);

  const syncFromEditor = () => {
    if (!bodyRef.current) return;
    setBodyHtml(bodyRef.current.innerHTML);
  };

  // Drop lands wherever the pointer was, not wherever the caret last was —
  // so a dropped image needs its own Range from the drop point, applied
  // just before the insert. Paste/file-picker/AI-photo inserts have no such
  // point and just fall back to whatever's currently selected.
  const insertImage = (dataUrl: string, dropRange?: Range) => {
    bodyRef.current?.focus();
    if (dropRange) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(dropRange);
    }
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    const file = e.dataTransfer.files[0];
    if (!file?.type.startsWith("image/")) return;
    e.preventDefault();

    const dropRange = caretRangeFromPoint(e.clientX, e.clientY) ?? undefined;
    const reader = new FileReader();
    reader.onload = () => insertImage(reader.result as string, dropRange);
    reader.readAsDataURL(file);
  };

  const captureAttachImageRange = () => {
    const selection = window.getSelection();
    const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
    attachImageRangeRef.current =
      range && bodyRef.current?.contains(range.startContainer) ? range.cloneRange() : null;
  };

  const handleAttachImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const range = attachImageRangeRef.current ?? undefined;
    const reader = new FileReader();
    reader.onload = () => insertImage(reader.result as string, range);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos((current) => [...current, { dataUrl: reader.result as string, name: file.name }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  };

  const resolvePhotoPlaceholders = (html: string) => {
    let resolved = html;
    photos.forEach((photo, i) => {
      resolved = resolved.split(`{{PHOTO_${i + 1}}}`).join(photo.dataUrl);
    });
    return resolved;
  };

  const handleGenerateEmailHtml = async () => {
    setAiStage("generating");
    setAiError(null);

    const formName = availableForms.find((f) => f.id === formId)?.name ?? null;
    const result = await generateEmailHtmlWithAI(designBrief, contentDetails, {
      subject,
      formName,
      photoCount: photos.length,
    });

    setAiStage("idle");
    if ("error" in result) {
      setAiError(result.error);
      return; // manually-entered body, if any, is left untouched
    }

    // Show a preview before committing — an AI pass over a rich, table-based
    // design can miss the brief, and contentEditable is a poor place to
    // judge the real result (bounded height, editable, no isolation from
    // the admin UI's own styles) as well as a risky place to land it
    // unreviewed (typing/selecting inside complex markup can mangle it).
    setLastGeneratedHtml(result.bodyHtml);
    setPreviewHtml(resolvePhotoPlaceholders(result.bodyHtml));
  };

  const handleApplyFollowUp = async () => {
    if (!followUpInstruction.trim() || lastGeneratedHtml === null) return;
    setAiStage("revising");
    setAiError(null);

    const formName = availableForms.find((f) => f.id === formId)?.name ?? null;
    const result = await generateEmailHtmlWithAI(
      followUpInstruction,
      "",
      { subject, formName, photoCount: photos.length },
      lastGeneratedHtml,
    );

    setAiStage("idle");
    if ("error" in result) {
      setAiError(result.error);
      return; // keep the current preview as-is
    }

    setLastGeneratedHtml(result.bodyHtml);
    setPreviewHtml(resolvePhotoPlaceholders(result.bodyHtml));
    setFollowUpInstruction("");
  };

  const handleUsePreview = () => {
    if (previewHtml === null) return;
    setBodyHtml(previewHtml);
    if (bodyRef.current) bodyRef.current.innerHTML = previewHtml;
    setAiHtmlOpen(false);
    setPreviewHtml(null);
    setLastGeneratedHtml(null);
    setDesignBrief("");
    setContentDetails("");
    setFollowUpInstruction("");
    setPhotos([]);
  };

  const handleDiscardPreview = () => {
    setPreviewHtml(null);
    setLastGeneratedHtml(null);
    setFollowUpInstruction("");
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
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Body</label>

        <div
          ref={bodyRef}
          className={styles.richBody}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromEditor}
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          data-placeholder="Write your email…"
        />

        <input type="hidden" name="body_html" value={bodyHtml} />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>
          Include a fillable form <span className={styles.optional}>(optional — a fill link is appended to the email)</span>
        </span>
        <SelectDropdown
          options={[
            { id: "", label: "No form" },
            ...availableForms.map((form) => ({ id: form.id, label: form.name })),
          ]}
          value={formId}
          onChange={setFormId}
          placeholder="No form"
          searchable
          searchPlaceholder="Search forms…"
          createLabel="New Form"
          createHref="/portal/admin/form/new"
        />
        <input type="hidden" name="form_id" value={formId} />
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Recipients</span>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => setFiltersOpen(true)}
          style={{ alignSelf: "flex-start" }}
        >
          Filter Recipients
        </button>
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

      <div className={styles.composeToolbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className={styles.attachButton}
            aria-label="Generate HTML with AI"
            title="Generate HTML with AI"
            onClick={() => setAiHtmlOpen(true)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2.5a1 1 0 0 1 .967.744l.902 3.386a4.5 4.5 0 0 0 3.18 3.18l3.387.903a1 1 0 0 1 0 1.933l-3.386.902a4.5 4.5 0 0 0-3.18 3.18l-.903 3.387a1 1 0 0 1-1.933 0l-.902-3.386a4.5 4.5 0 0 0-3.18-3.18l-3.387-.903a1 1 0 0 1 0-1.933l3.386-.902a4.5 4.5 0 0 0 3.18-3.18l.903-3.387A1 1 0 0 1 12 2.5Z" />
            </svg>
          </button>
          <label
            className={styles.attachButton}
            aria-label="Attach a file"
            onMouseDown={captureAttachImageRange}
          >
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
        <SubmitButton pendingLabel="Sending…" className={styles.sendButton} ariaLabel="Send">
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
              d="M6 12 3.269 3.126A59.77 59.77 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5"
            />
          </svg>
        </SubmitButton>
      </div>

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

      <div ref={aiRegionRef} tabIndex={-1}>
        <Modal
          open={aiHtmlOpen}
          onClose={() => {
            if (aiStage !== "idle") return;
            setAiHtmlOpen(false);
            setPreviewHtml(null);
            setLastGeneratedHtml(null);
            setFollowUpInstruction("");
          }}
          title={previewHtml === null ? "Generate HTML with AI" : "Preview"}
        >
          {previewHtml === null ? (
            <div className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai_design_brief">
                  What should the email look like?
                </label>
                <textarea
                  id="ai_design_brief"
                  className={styles.textarea}
                  rows={3}
                  placeholder="Bold, colorful invite for an evening tech meetup — dark hero banner, big headline, a clear RSVP button"
                  value={designBrief}
                  onChange={(e) => setDesignBrief(e.target.value)}
                  disabled={aiStage !== "idle"}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai_content_details">
                  Anything else you&apos;d like to add?
                  <span className={styles.optional}> (optional)</span>
                </label>
                <textarea
                  id="ai_content_details"
                  className={styles.textarea}
                  rows={3}
                  placeholder="Event is Thursday Sept 17, 6–9:30pm at The Foundry downtown. Mention limited seats."
                  value={contentDetails}
                  onChange={(e) => setContentDetails(e.target.value)}
                  disabled={aiStage !== "idle"}
                />
              </div>

              <div className={styles.field}>
                <span className={styles.label}>
                  Photos to include <span className={styles.optional}>(optional)</span>
                </span>
                {photos.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                    {photos.map((photo, index) => (
                      <div key={index} style={{ position: "relative" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          style={{
                            width: 64,
                            height: 64,
                            objectFit: "cover",
                            borderRadius: 6,
                            border: "1px solid var(--border)",
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          aria-label={`Remove ${photo.name}`}
                          disabled={aiStage !== "idle"}
                          style={{
                            position: "absolute",
                            top: -6,
                            right: -6,
                            width: 18,
                            height: 18,
                            lineHeight: 1,
                            fontSize: 12,
                            borderRadius: "50%",
                            border: "1px solid var(--border)",
                            background: "#ffffff",
                            color: "var(--foreground)",
                            cursor: "pointer",
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className={styles.secondaryButton} style={{ display: "inline-flex", cursor: "pointer" }}>
                  {photos.length > 0 ? "Add more photos" : "Choose photos"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleAddPhotos}
                    disabled={aiStage !== "idle"}
                  />
                </label>
              </div>

              {formId && (
                <p className={styles.description}>
                  A fill-out link for the attached form will be added to the design — it becomes
                  active once you actually send the email; it won&apos;t work yet in preview.
                </p>
              )}

              {aiError && <p className={styles.error}>{aiError}</p>}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={aiStage !== "idle" || !designBrief.trim()}
                  onClick={handleGenerateEmailHtml}
                >
                  {aiStage === "idle" ? "Generate" : "Working…"}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.form}>
              <iframe
                title="Generated email preview"
                srcDoc={previewHtml}
                style={{
                  width: "100%",
                  height: "60vh",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  background: "#ffffff",
                }}
              />
              {formId && (
                <p className={styles.description}>
                  The form fill-out link isn&apos;t active in this preview — it becomes active
                  once you actually send the email.
                </p>
              )}

              <div className={styles.field}>
                <label className={styles.label} htmlFor="ai_follow_up">
                  Ask for changes
                </label>
                <div className={styles.formRow}>
                  <input
                    id="ai_follow_up"
                    className={styles.input}
                    placeholder="Make the headline bigger and use a blue button"
                    value={followUpInstruction}
                    onChange={(e) => setFollowUpInstruction(e.target.value)}
                    disabled={aiStage !== "idle"}
                  />
                  <button
                    type="button"
                    className={styles.secondaryButton}
                    disabled={aiStage !== "idle" || !followUpInstruction.trim()}
                    onClick={handleApplyFollowUp}
                  >
                    {aiStage === "revising" ? "Working…" : "Apply"}
                  </button>
                </div>
              </div>

              {aiError && <p className={styles.error}>{aiError}</p>}

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  disabled={aiStage !== "idle"}
                  onClick={handleDiscardPreview}
                >
                  Back
                </button>
                <button
                  type="button"
                  className={styles.primaryButton}
                  disabled={aiStage !== "idle"}
                  onClick={handleUsePreview}
                >
                  Use This
                </button>
              </div>
            </div>
          )}
        </Modal>

        {aiStage !== "idle" && (
          <AiGeneratingOverlay
            message={aiStage === "generating" ? "Generating your email…" : "Applying your changes…"}
          />
        )}
      </div>
    </form>
  );
}
