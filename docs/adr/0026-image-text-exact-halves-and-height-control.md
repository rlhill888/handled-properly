---
status: accepted
---

# Image & Text: exact 50/50 columns, admin-controlled image height

Two related fixes to how the `image_text` block lays out its two sides.

**Exact halves.** The side-by-side layout was a flex row with two `width: 50%` children and a `gap`. Flexbox's default `flex-shrink: 1` means those children don't actually stay at 50% — `50% + 50% + gap` exceeds the row's width, so both sides shrink to fit, landing each one just under half. Switched to CSS Grid (`grid-template-columns: 1fr 1fr`) for the ≥800px side-by-side layout: grid divides the row's width *after* subtracting the gap, so each column is exactly half regardless of gap size. The image-left/image-right toggle now uses `order` instead of `flex-direction: row-reverse`, since that's how you reorder grid items.

**Admin-controlled image height.** `image_text` gained `mediaHeight: number | null` — a number crops the image to that height with `object-fit: cover`, `null` keeps its natural aspect ratio uncropped. This wasn't extended to the plain `image` block or `gallery` in this pass — only `image_text` was asked for, and a reader wanting the same control elsewhere should treat that as a new, separate request rather than an oversight.

New blocks default to `mediaHeight: 400` rather than `null` (see [`0028-default-image-text-media-height`](./0028-default-image-text-media-height.md)) — `null` stayed the fallback for parsing a block that somehow lacks the field at all, but is no longer what a freshly added block starts with.
