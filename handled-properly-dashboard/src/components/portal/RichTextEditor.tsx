"use client";

import { useEffect, useRef, useState } from "react";
import sharedStyles from "@/styles/admin-shared.module.css";
import styles from "./RichTextEditor.module.css";

type ActiveFormats = { bold: boolean; italic: boolean; block: string; focused: boolean };
// focused is tracked separately from block ("" also means "cursor is in a
// plain paragraph") so the Paragraph button doesn't show as active before
// the editor has ever been clicked into.
const INACTIVE: ActiveFormats = { bold: false, italic: false, block: "", focused: false };

// "highlight" was removed outright (not just unselected) -- see
// docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md.
export type ToolbarOption = "bold" | "italic" | "headings";
const ALL_TOOLBAR_OPTIONS: ToolbarOption[] = ["bold", "italic", "headings"];

// Same contentEditable-div-synced-to-state primitive the email composer
// already uses (ComposeForm.tsx's .richBody), with an actual formatting
// toolbar added on top via document.execCommand -- the composer has none
// today. Deliberately not a new rich-text library (see
// docs/adr/0018-four-content-block-types.md's sibling reasoning on scope):
// each block type only gets the subset of bold/italic/headings it needs
// (see docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md).
export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  toolbar = ALL_TOOLBAR_OPTIONS,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  // Which buttons to show -- Paragraph uses ["italic"], image_text uses
  // ["bold", "italic"] (see
  // docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md).
  // "headings" governs H2/H3/Paragraph together since they only make sense
  // as a group; no current block type selects it.
  toolbar?: ToolbarOption[];
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<ActiveFormats>(INACTIVE);

  // Only sync external -> DOM when they've actually diverged (e.g. initial
  // mount, or the parent reset this block) -- syncing on every value change
  // would reset the caret position on every keystroke, since onInput below
  // is what produced that value change in the first place.
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // queryCommandState/Value reflect formatting AT THE CURRENT CURSOR
  // POSITION, so the toolbar can show "you're inside bold text" the same
  // way Google Docs/Word do. Called from two places: the selectionchange
  // listener below (covers the cursor moving by typing, clicking, arrow
  // keys, or selecting) and directly from runCommand (see there for why
  // selectionchange alone isn't enough). Guarded to this editor's own
  // selection so multiple RichTextEditors on the same admin page (one per
  // paragraph/image_text block) don't clobber each other's toolbar state
  // when focus moves between them.
  const refreshActiveState = () => {
    const node = editorRef.current;
    if (!node) return;
    const selection = document.getSelection();
    const anchor = selection?.anchorNode;
    if (!anchor || !node.contains(anchor)) {
      setActive(INACTIVE);
      return;
    }

    setActive({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      block: (document.queryCommandValue("formatBlock") || "").toLowerCase(),
      focused: true,
    });
  };

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActiveState);
    return () => document.removeEventListener("selectionchange", refreshActiveState);
  }, []);

  const syncFromEditor = () => {
    if (editorRef.current) onChange(editorRef.current.innerHTML);
  };

  // preventDefault on mousedown (not click) stops the browser from
  // blurring/collapsing the editor's selection before the click handler
  // runs -- without it, execCommand would have nothing selected to act on.
  const runCommand = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    syncFromEditor();
    // execCommand("bold"/"italic") toggles formatting in place without
    // necessarily moving the selection, so selectionchange often doesn't
    // fire -- without this direct call, the button's active ring wouldn't
    // update until some later, unrelated selection change (e.g. an arrow
    // key press), rather than the moment you click it.
    refreshActiveState();
  };

  const preventBlur = (e: React.MouseEvent) => e.preventDefault();

  const isParagraphActive =
    active.focused && (active.block === "" || active.block === "p" || active.block === "div");

  return (
    <div>
      <div className={styles.toolbar}>
        {toolbar.includes("bold") && (
          <button
            type="button"
            className={`${styles.button} ${active.bold ? styles.buttonActive : ""}`}
            onMouseDown={preventBlur}
            onClick={() => runCommand("bold")}
            aria-label="Bold"
            aria-pressed={active.bold}
          >
            B
          </button>
        )}
        {toolbar.includes("italic") && (
          <button
            type="button"
            className={`${styles.button} ${styles.buttonItalic} ${active.italic ? styles.buttonActive : ""}`}
            onMouseDown={preventBlur}
            onClick={() => runCommand("italic")}
            aria-label="Italic"
            aria-pressed={active.italic}
          >
            I
          </button>
        )}
        {toolbar.includes("headings") && (
          <>
            <button
              type="button"
              className={`${styles.button} ${active.block === "h2" ? styles.buttonActive : ""}`}
              onMouseDown={preventBlur}
              onClick={() => runCommand("formatBlock", "h2")}
              aria-label="Heading 2"
              aria-pressed={active.block === "h2"}
            >
              H2
            </button>
            <button
              type="button"
              className={`${styles.button} ${active.block === "h3" ? styles.buttonActive : ""}`}
              onMouseDown={preventBlur}
              onClick={() => runCommand("formatBlock", "h3")}
              aria-label="Heading 3"
              aria-pressed={active.block === "h3"}
            >
              H3
            </button>
            <button
              type="button"
              className={`${styles.button} ${isParagraphActive ? styles.buttonActive : ""}`}
              onMouseDown={preventBlur}
              onClick={() => runCommand("formatBlock", "p")}
              aria-label="Paragraph"
              aria-pressed={isParagraphActive}
            >
              P
            </button>
          </>
        )}
      </div>

      <div
        ref={editorRef}
        className={sharedStyles.richBody}
        contentEditable
        suppressContentEditableWarning
        onInput={syncFromEditor}
        data-placeholder={placeholder}
      />
    </div>
  );
}
