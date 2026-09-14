"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { sendMassEmail, uploadEmailAssets, type ActionState } from "./actions";
import { suggestButtonMappingAction, applyButtonMappingAction } from "./ai-actions";
import type {
  ButtonCandidateOption,
  FormSuggestion,
  ButtonMappingResult,
} from "@/lib/ai-email-button-mapping";
import SubmitButton from "@/components/portal/SubmitButton";
import Modal from "@/components/portal/Modal";
import SelectDropdown from "@/components/portal/SelectDropdown";
import AiGeneratingOverlay from "@/components/AiGeneratingOverlay";
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

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Client-side mirror of the token/fallback-link resolution sendMassEmail
// does server-side (actions.ts) — purely for an accurate, instantly-updating
// preview; the actual send still resolves this itself, independently, since
// this is trusted only for what it's displayed for, not for what gets sent.
function resolvePreviewLinks(
  html: string,
  formIds: string[],
  availableForms: { id: string; name: string }[]
): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const fillUrl = (formId: string) => `${siteUrl}/forms/fill/${formId}`;

  let resolved = html;
  for (const formId of formIds) {
    const token = `{{FORM_LINK_${formId}}}`;
    if (resolved.includes(token)) {
      resolved = resolved.split(token).join(fillUrl(formId));
    } else {
      const form = availableForms.find((f) => f.id === formId);
      if (form) resolved += `<p><a href="${fillUrl(formId)}">Fill out ${form.name}</a></p>`;
    }
  }
  return resolved;
}

// An exported HTML file's images are referenced by a local relative path
// (e.g. src="images/photo1.png") that can't resolve once the HTML is
// emailed out. Matches by trailing filename only — not the exact relative
// path prefix, which varies (images/, ./images/, assets/img/, ...) — so it
// covers both <img src="..."> and CSS url(...) backgrounds uniformly.
function inlineEmailAssetUrls(html: string, urlsByFilename: Record<string, string>): string {
  let result = html;
  for (const [filename, url] of Object.entries(urlsByFilename)) {
    const escaped = escapeRegExp(filename);
    result = result.replace(new RegExp(`(src\\s*=\\s*["'])[^"']*?${escaped}(["'])`, "gi"), `$1${url}$2`);
    result = result.replace(
      new RegExp(`url\\((['"]?)[^'")]*?${escaped}\\1\\)`, "gi"),
      `url($1${url}$1)`
    );
  }
  return result;
}

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
  const [formIds, setFormIds] = useState<string[]>([]);
  const [pendingFormId, setPendingFormId] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  // Opening the native file picker steals focus/selection from the body
  // before the file is even chosen, so by the time handleAttachImage runs
  // there's nothing left to insert at. Captured on mousedown — just before
  // the picker opens — so the cursor position survives the round trip.
  const attachImageRangeRef = useRef<Range | null>(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isApplyingMapping, setIsApplyingMapping] = useState(false);
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [mappingResults, setMappingResults] = useState<ButtonMappingResult[] | null>(null);
  const [mappingReviewOpen, setMappingReviewOpen] = useState(false);
  const [candidateOptions, setCandidateOptions] = useState<ButtonCandidateOption[]>([]);
  // Keyed by formId — the candidate index as a string, or "none" for
  // "no button, append a plain link instead." Seeded from AI's suggestion,
  // freely editable before anything is actually applied.
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);

  const syncFromEditor = () => {
    if (!bodyRef.current) return;
    setBodyHtml(bodyRef.current.innerHTML);
    setMappingResults(null);
  };

  // Drop lands wherever the pointer was, not wherever the caret last was —
  // so a dropped image needs its own Range from the drop point, applied
  // just before the insert. Paste/file-picker inserts have no such point
  // and just fall back to whatever's currently selected.
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

  // Emails are designed externally (e.g. in Canva) and exported as a folder
  // (an .html file plus an "images/" subfolder it references by relative
  // path) — this picks up the whole folder, not just the .html file, since
  // those relative paths can't resolve once the HTML is emailed out. Every
  // image in the folder gets uploaded to public storage and the HTML's
  // references rewritten to the real hosted URLs (inlineEmailAssetUrls).
  // This is just a second way to populate the same body editor, alongside
  // typing directly into it — an .html file with no accompanying images
  // works exactly as before.
  const handleUploadHtml = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setMappingError(null);

    const htmlFile = files.find((f) => f.name.toLowerCase().endsWith(".html"));
    if (!htmlFile) {
      setMappingError("No .html file found in the selected folder.");
      return;
    }

    const html = await htmlFile.text();
    const imageFiles = files.filter((f) => f !== htmlFile && f.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setBodyHtml(html);
      if (bodyRef.current) bodyRef.current.innerHTML = html;
      setMappingResults(null);
      return;
    }

    setIsUploadingAssets(true);
    const assetFormData = new FormData();
    for (const file of imageFiles) assetFormData.append("files", file);
    const result = await uploadEmailAssets(assetFormData);
    setIsUploadingAssets(false);

    if ("error" in result) {
      setMappingError(result.error);
      return;
    }

    const finalHtml = inlineEmailAssetUrls(html, result.urls);
    setBodyHtml(finalHtml);
    if (bodyRef.current) bodyRef.current.innerHTML = finalHtml;
    setMappingResults(null);
  };

  const attachedForms = formIds
    .map((id) => availableForms.find((f) => f.id === id))
    .filter((f): f is FormOption => Boolean(f));

  const previewHtml = useMemo(
    () => resolvePreviewLinks(bodyHtml, formIds, availableForms),
    [bodyHtml, formIds, availableForms]
  );

  // Step 1: asks AI to suggest which button each attached Form should link
  // to — applies nothing yet. Opens a review modal so the admin can confirm
  // or correct every suggestion before anything actually changes.
  const handleOpenMappingReview = async () => {
    setMappingError(null);
    setIsSuggesting(true);
    const result = await suggestButtonMappingAction(bodyHtml, attachedForms);
    setIsSuggesting(false);

    if ("error" in result) {
      setMappingError(result.error);
      return;
    }

    setCandidateOptions(result.candidates);
    setSelections(
      Object.fromEntries(
        result.suggestions.map((s) => [s.formId, s.candidateIndex === null ? "none" : String(s.candidateIndex)])
      )
    );
    setMappingReviewOpen(true);
  };

  // Step 2: applies whatever the admin has actually confirmed in the review
  // modal — swaps each chosen button's href for a {{FORM_LINK_<formId>}}
  // token, resolved to the real fill-out URL at actual send time
  // (sendMassEmail in actions.ts). A Form left on "no button" still gets a
  // plain link appended when the email sends.
  const handleApplyMapping = async () => {
    setMappingError(null);
    setIsApplyingMapping(true);
    const mapping: FormSuggestion[] = attachedForms.map((form) => {
      const selection = selections[form.id] ?? "none";
      return {
        formId: form.id,
        formName: form.name,
        candidateIndex: selection === "none" ? null : Number(selection),
      };
    });
    const result = await applyButtonMappingAction(bodyHtml, mapping);
    setIsApplyingMapping(false);

    if ("error" in result) {
      setMappingError(result.error);
      return;
    }

    setBodyHtml(result.bodyHtml);
    if (bodyRef.current) bodyRef.current.innerHTML = result.bodyHtml;
    setMappingResults(result.results);
    setMappingReviewOpen(false);
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
          data-placeholder="Write your email, or upload HTML designed elsewhere (e.g. Canva)…"
        />

        <input type="hidden" name="body_html" value={bodyHtml} />
      </div>

      {bodyHtml.trim() && (
        <div className={styles.field}>
          <button
            type="button"
            className={styles.secondaryButton}
            style={{ alignSelf: "flex-start" }}
            onClick={() => setPreviewOpen(true)}
          >
            Preview Email
          </button>
        </div>
      )}

      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title="Email Preview">
        <div className={styles.form}>
          <p className={styles.description}>
            Buttons/links are live here — click one to confirm it goes where it should.
          </p>
          <iframe
            title="Email preview"
            srcDoc={previewHtml}
            style={{
              width: "100%",
              height: "60vh",
              border: "1px solid var(--border)",
              borderRadius: 4,
              background: "#ffffff",
            }}
          />
        </div>
      </Modal>

      <div className={styles.field}>
        <span className={styles.label}>
          Include fillable forms <span className={styles.optional}>(optional — a fill link is appended to the email for each)</span>
        </span>

        {formIds.length > 0 && (
          <ul className={styles.metaRow}>
            {formIds.map((id) => {
              const form = availableForms.find((f) => f.id === id);
              return (
                <li key={id} className={styles.checkboxRow}>
                  {form?.name ?? id}
                  <button
                    type="button"
                    className={styles.dangerButton}
                    style={{ marginLeft: 8 }}
                    onClick={() => {
                      setFormIds((current) => current.filter((formId) => formId !== id));
                      setMappingResults(null);
                    }}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className={styles.formRow}>
          <SelectDropdown
            options={availableForms
              .filter((form) => !formIds.includes(form.id))
              .map((form) => ({ id: form.id, label: form.name }))}
            value={pendingFormId}
            onChange={setPendingFormId}
            placeholder="Add a form…"
            searchable
            searchPlaceholder="Search forms…"
            createLabel="New Form"
            createHref="/portal/admin/form/new"
          />
          <button
            type="button"
            className={styles.secondaryButton}
            disabled={!pendingFormId}
            onClick={() => {
              setFormIds((current) => [...current, pendingFormId]);
              setPendingFormId("");
              setMappingResults(null);
            }}
          >
            Add
          </button>
        </div>

        {formIds.map((id) => (
          <input key={id} type="hidden" name="form_ids" value={id} />
        ))}

        {formIds.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isSuggesting || !bodyHtml.trim()}
              onClick={handleOpenMappingReview}
            >
              {isSuggesting ? "Analyzing…" : "Map Forms to Buttons"}
            </button>
            <p className={styles.description}>
              Suggests the best-matching button already in the Body for each attached form — you
              confirm or correct each one before anything changes. Any form left on &ldquo;no
              button&rdquo; still gets a plain link appended when the email sends.
            </p>

            {mappingError && <p className={styles.error}>{mappingError}</p>}

            {mappingResults && (
              <ul className={styles.metaRow} style={{ flexDirection: "column", alignItems: "flex-start" }}>
                {mappingResults.map((r) => (
                  <li key={r.formId} className={styles.description}>
                    {r.matched
                      ? `✓ ${r.formName} → matched button "${r.buttonText}"`
                      : `— ${r.formName} → no matching button found, a link will be added when sent`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <Modal
        open={mappingReviewOpen}
        onClose={() => setMappingReviewOpen(false)}
        title="Confirm Button Mapping"
      >
        <div className={styles.form}>
          {mappingError && <p className={styles.error}>{mappingError}</p>}

          {attachedForms.map((form) => (
            <div key={form.id} className={styles.field}>
              <span className={styles.label}>{form.name}</span>
              <SelectDropdown
                options={[
                  { id: "none", label: "No button — append a link instead" },
                  ...candidateOptions.map((c) => ({ id: String(c.index), label: `"${c.text}"` })),
                ]}
                value={selections[form.id] ?? "none"}
                onChange={(value) => setSelections((current) => ({ ...current, [form.id]: value }))}
                placeholder="Choose a button…"
              />
            </div>
          ))}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryButton}
              disabled={isApplyingMapping}
              onClick={() => setMappingReviewOpen(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.primaryButton}
              disabled={isApplyingMapping}
              onClick={handleApplyMapping}
            >
              {isApplyingMapping ? "Applying…" : "Apply Mapping"}
            </button>
          </div>
        </div>
      </Modal>

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
          <label className={styles.attachButton} aria-label="Upload email folder">
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
                d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
              />
            </svg>
            <input
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={handleUploadHtml}
              {...{ webkitdirectory: "", directory: "" }}
            />
          </label>
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

      {isSuggesting && <AiGeneratingOverlay message="Analyzing buttons…" />}
      {isUploadingAssets && <AiGeneratingOverlay message="Uploading images…" />}
    </form>
  );
}
