---
status: accepted
---

# Highlight removed; Image & Text's toolbar narrowed to bold + italic

Two related simplifications to the rich-text toolbars:

- **Highlight removed entirely**, not just unselected by any one block type. It's gone from `RichTextEditor`'s `ToolbarOption` union, the button, the active-state tracking, and both sanitizer allowlists (`sanitizeBlockHtml`, `sanitizeParagraphHtml` in `blocks-sanitize.ts` no longer allow `span`/`style` at all). Paragraph, which briefly had `["italic", "highlight"]` (see `0023-title-and-paragraph-replace-text.md`), is now `["italic"]` only.
- **Image & Text's toolbar narrowed** from the full set (bold, italic, highlight, headings) to just `["bold", "italic"]`. Headings don't fit a block whose text is a supporting caption next to an image, not a document with its own heading hierarchy.

`headings` remains a valid `ToolbarOption` in `RichTextEditor` even though no current block type selects it — removing the code path would be presumptuous when the ask was to narrow *this* block's toolbar, not to delete heading support from the shared component. Highlight is different: it was asked to be removed "all together," so its implementation is gone, not just unused.

This was a clean cutover, matching every other Content Block schema change so far: no live About or Blog Post content used `highlight` or `image_text`'s headings when this shipped.
