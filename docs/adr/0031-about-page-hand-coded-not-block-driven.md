---
status: accepted
---

# The /about page is hand-coded again, not Content-Block-driven

`/about` was rebuilt on the Content Block system (`docs/adr/0017` onward) so the admin could compose the whole page from stacked blocks. The admin asked for something more specific instead: a real About page following a deliberate content structure (headline+photo → introduction/story → what makes the business different → a testimonial → a "Plan Your Event" CTA), and wanted it hand-coded for full design control rather than assembled from the generic block set.

`/about/page.tsx` now renders bespoke JSX + `about.module.css`, the same way `Hero.tsx`/`Services.tsx` are hand-coded homepage sections — not `BlockRenderer`, and it no longer reads `site_about_content` at all.

**The Content Block system itself is untouched.** `src/lib/blocks.ts`, `BlockRenderer`, `BlockEditor`, the `site_about_content` table, and the admin's `/portal/admin/website/about` editor all still exist and still work exactly as before — Blog Posts still use all of it. The admin's About editor is currently "live but disconnected": editing it no longer changes anything on the public `/about` page, since nothing reads that table anymore. This was left in place deliberately (per the admin's "for now, keep the logic" framing) rather than removed, in case `/about` moves back to being block-driven later.

**No fabricated content.** The reference content spec asked for a team section (names/photos/bios) and a testimonial (social proof). Both risk fabricating fake identities or a fake customer quote for a real business's public page if invented outright. The team section was dropped from this version entirely (admin's choice); the testimonial is a clearly-marked placeholder (dashed border, an explicit "add a real client quote here" tag, and placeholder attribution) rather than a made-up quote attributed to an invented client.

Images (`public/about/hero.png`, `public/about/story.png`) are generated abstract placeholders in this site's own existing line-art style (same technique as the earlier Content-Block-era About images) — not real event photography, for the same reason: no real photos were available to use honestly.
