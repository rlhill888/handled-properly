---
status: accepted
---

# Content Block types, not a full page-builder layout library

The About page and Blog Post bodies are composed of admin-stacked Content Blocks (see `CONTEXT.md`), inspired by a Wix-style page builder mockup showing several distinct layouts: an image+headline section, an image+story section, an interactive image carousel with arrows and dots, a 3-image grid with captions, and a dark "statement" banner.

We implemented four block types at first — `text`, `image`, `image_text`, `gallery` — not one per mockup layout. Two collapses:

- **No separate "statement" type.** The mockup's dark banner is visually just `image_text` with a dark background and different type scale. `image_text` gained a `dark` boolean instead of a fifth block type, so the admin doesn't have to learn a type that's structurally identical to one they already know.
- **No interactive carousel.** A carousel needs client-side JS (arrow navigation, dot state, touch/swipe), materially more work than every other block combined. `gallery` covers "show several images with captions" as a static responsive grid instead — the same content, without the interaction.

A `divider` type (a plain horizontal rule, no fields) was added afterward — genuinely distinct from every existing type (a pure visual separator, not a variant of an image/text layout), so it became its own block rather than a flag on the other four. The initial version of this feature briefly explored "a `showDivider` toggle on every block type" instead; that was reverted in favor of a dedicated type before it shipped, since it would have meant threading the same field through every block's schema, admin UI, and renderer for something that's conceptually a block of its own.

A reader who wants an actual carousel, or another genuinely distinct layout (a video block, a quote block, etc.), should treat that as a new requirement, not evidence the current set is wrong — it's sized to "image and text sections" as asked, not to replicate every layout in the reference mockup.
