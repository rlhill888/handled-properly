---
status: accepted
---

# Gallery gained a carousel display mode

`docs/adr/0018-four-content-block-types.md` deliberately left the interactive carousel out of the original mockup's layouts: `gallery` rendered every image as a static responsive grid, and building real arrow/dot navigation was judged not worth the added client-side complexity for the first version of Content Blocks.

The admin asked for the carousel back. Rather than reintroduce it as its own block type (which would duplicate `gallery`'s image-list editing — add/remove/reorder items, titles, captions — for no real difference in *content*, only in *display*), Gallery gained a `displayMode: "grid" | "carousel"` field. The admin edits the same list of images either way; the field only changes how `BlockRenderer` presents them — `grid` unchanged, `carousel` renders `GalleryCarousel` (arrow buttons + dot navigation, one image at a time, click/tap only).

Scope still cut from the original mockup: no touch/swipe dragging (arrows and dots only) and no autoplay. A reader who wants either should treat it as a new requirement — this version is sized to "let the admin choose grid or carousel," not to fully replicate every carousel interaction pattern.
