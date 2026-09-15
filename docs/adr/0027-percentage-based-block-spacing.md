---
status: accepted
---

# Block spacing (marginTop/marginBottom) is a percentage, not pixels

`docs/adr/0020-per-block-margins.md` gave every block a fixed-pixel top/bottom margin. Changed to a percentage instead: the same `marginTop`/`marginBottom` fields, same admin fields in `BlockEditor`, but interpreted (and rendered, in `BlockRenderer.tsx`'s `spacingStyle`) as `${n}%` rather than `${n}px`. Default moved from 20/20 to 2/2 to land in roughly the same visual range at the widths this content actually renders at.

**Caveat worth knowing**: CSS resolves a `margin-top`/`margin-bottom` percentage against the containing block's *width*, not its height or the viewport — this is longstanding, correct CSS behavior, not a bug, but it does mean a block's vertical spacing scales with how wide its container is (`.content`'s width, up to `max-width: 1100px`), not with the page's vertical scroll length. In practice this reads as "spacing that scales down a bit on narrower screens," which is a reasonable side effect for this use case, not a defect — but a reader debugging "why did my spacing change when I resized the window's width, not its height" should know this is expected, not a rendering bug.
