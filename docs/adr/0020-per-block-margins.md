---
status: accepted
---

# Content Block spacing is a per-block margin, not a container gap

The space between stacked Content Blocks was originally a single `gap: 40px` on `.section` (`BlockRenderer.module.css`) — uniform, and not admin-controllable. The admin asked to control the top/bottom spacing of each block individually.

A flex/grid `gap` is a property of the *container*, not its children, so it can't vary per item — the only way to give each block its own spacing is to move that responsibility onto the block itself. Every block type gained `marginTop`/`marginBottom`, defaulting so two untouched, adjacent blocks still sum to roughly the original 40px gap. `.section`'s own `gap` was removed entirely so it can't add undocumented space on top of what each block declares. Flexbox items (which `.section`'s children are) don't collapse adjacent margins the way normal block-level siblings do, so the space between two blocks is simply `blockA.marginBottom + blockB.marginTop` — additive and predictable, not a `max()`-style collapse the admin would have to reason about.

Applies uniformly to all block types, including `divider` (which otherwise has no fields of its own) — the admin thinks of spacing as a property of "a block on the page," not of specific content types.

(Originally pixels, defaulting 20/20 — changed to percentages by [`0027-percentage-based-block-spacing`](./0027-percentage-based-block-spacing.md).)
