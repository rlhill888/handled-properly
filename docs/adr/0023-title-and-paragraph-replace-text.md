---
status: accepted
---

# Title and Paragraph replace the single Text block

The original `text` Content Block was one type doing two jobs: a full toolbar (bold, italic, highlight, H2, H3, paragraph) covering both "this is a section heading" and "this is body copy" content, with the admin picking which by clicking a formatBlock button rather than by picking a block type.

Replaced with two dedicated types instead:

- **Title**: plain text, no formatting toolbar at all. A heading is just a heading — there's nothing to bold or highlight inside one, so there's no toolbar to build or reason about.
- **Paragraph**: rich text, but the toolbar only exposes Italic and Highlight. No Bold, no headings — a paragraph's formatting needs are narrower, and there's nothing for it to switch its own block-level tag *to* (it's always a paragraph), so the H2/H3/P group of buttons the old Text block had doesn't apply here.

`image_text`'s own body text keeps the full toolbar (bold/italic/highlight/headings) — it wasn't part of this change, so a reader who wants Title/Paragraph's narrower model applied there too should treat that as a separate decision, not an oversight.

This was a clean cutover, not a migration: no live About or Blog Post content used the old `text` type when this shipped, so `text` was removed outright rather than kept around for backward compatibility.
