---
status: accepted
---

# Title gains muted/supporting text; Features and CTA join as new block types

The admin shared a reference design for the About page and asked for the Content Block system to be extended to reproduce it. Three additions, mapped directly onto pieces of that design:

**Title gained `mutedText` and `supportingText`** (both optional, both default `null` — an existing bare Title with just `text` renders exactly as it did before). `mutedText` adds a second, muted-gray line after the main heading (the "BIG MOMENTS. SMALL DETAILS." dark / "ALL HANDLED." muted two-tone stack). `supportingText`, when set, moves the block into a two-column layout — the heading on one side, a short paragraph beside it with a thin divider between them. This was folded into Title rather than becoming a seventh block type: structurally it's still just a heading, with two optional pieces of extra content, not a fundamentally different kind of section.

**Features** (`type: "features"`) — a numbered list of short title+description items in a responsive grid (the "01 Clarity at every step / 02 Everyone in sync / 03 Details that matter" row). Numbers are computed from each item's position at render time, not stored, so reordering items or moving the whole block never requires renumbering anything.

**CTA** (`type: "cta"`) — a full-width statement banner with a heading and exactly one button/link (the closing "YOUR NEXT EVENT. HANDLED PROPERLY." banner with a "Start Planning" button). This is not `image_text` with `dark: true` and no image: `image_text` is fundamentally an image-plus-text pairing, and a CTA has neither an image nor a text/image split — it has a heading and a link, which no existing block type modeled. Forcing it into `image_text` would produce a block whose name (Image & Text) never matches what it actually contains.

**Image gained `grayscale`** (boolean, default `false`) — the reference design's photography is desaturated; this is a per-image toggle (`filter: grayscale(1)`) rather than a site-wide setting, since not every image an admin uploads should be forced into that treatment.
