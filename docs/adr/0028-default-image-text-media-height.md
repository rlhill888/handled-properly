---
status: accepted
---

# New Image & Text blocks default to a 400px image height, not natural size

`mediaHeight` (added in `0026-image-text-exact-halves-and-height-control.md`) defaulted new blocks to `null` — the image's natural, uncropped aspect ratio. In practice, a tall photo (a portrait-orientation venue shot, for instance) next to a couple of lines of text left a large empty gap under the text: both sides share one grid row, so the row is exactly as tall as its taller side, and CSS has no way to shrink that row to match the *shorter* side without cropping the taller one. This read as a layout bug rather than an intentional choice, even though nothing was actually misaligned.

New `image_text` blocks (via `createEmptyBlock`) now default `mediaHeight` to `400` instead of `null`, so a block looks reasonably balanced the moment it's created, before the admin has thought about the height field at all. `null` still exists and is still what a legacy/malformed block falls back to during parsing — an admin who wants a tall, uncropped photo can still clear the field back to blank per block.
