---
status: accepted
---

> **Note**: The five-piece structure described below (hero, story, differentiators, testimonial, CTA) grew into seven named sections plus the CTA, and testimonial was dropped — see [`0035`](./0035-about-page-seven-sections.md). `site_about_differentiators` from this ADR is now `site_about_values`. The reasoning below for *why* `/about` is admin-editable via its own fields (not Content Blocks, not `/about-and-connect`'s table) still holds.

# /about becomes admin-editable again, via its own fixed fields, not Content Blocks or the /about-and-connect data model

[`0031`](./0031-about-page-hand-coded-not-block-driven.md) made `/about` fully static, with the admin's Content Block editor for it left "live but disconnected" in case `/about` moved back to being block-driven later. The admin asked for `/about` to be admin-editable again, but not by reconnecting that block editor — the bespoke, hand-coded layout 0031 asked for (headline+photo → story → differentiators → testimonial → CTA) stays exactly as designed; only its specific text and images become editable.

**A new table, not a repurposed one.** `site_about_content` already exists, but it belongs to `/about-and-connect` (see [`0032`](./0032-about-page-editable-landing-page.md)/[`0033`](./0033-about-and-connect-is-a-separate-page.md)) — a completely different page with its own headshot/bio/social-links/featured-items shape. `/about`'s own fields live in a new singleton table, `site_about_page` (headline, hero photo, story body, story photo, testimonial quote/attribution, CTA heading/button text), plus `site_about_differentiators` for the "what makes us different" cards — admin-managed (add/edit/remove/reorder) the same way Social Link and Featured Item are, rather than a fixed count of three.

**The headline and story body are plain delimited text, not rich fields.** The headline is newline-separated lines (currently three), rendered one per line with the last line always muted, matching the original hard-coded headline's own styling — an admin who wants two lines or four just adds or removes a line break. The story body is paragraph(s) separated by a blank line, the same convention `about_body` already uses on `/about-and-connect`.

**No fabricated content, still.** The testimonial fields default to empty, not a copy of the placeholder text — the public page keeps 0031's placeholder treatment (dashed border, "add a real client quote here" tag) whenever `testimonial_quote` is blank, and only switches to the plain quote-card styling once the admin has entered a real one. Hero/story images fall back to the existing bundled `/about/hero.png`/`/about/story.png` placeholders when the admin hasn't uploaded a replacement, rather than the page breaking with nothing there.

**The admin route lives at `/portal/admin/website/about`** — freed up by 0033's rename of the old editor to `/portal/admin/website/about-and-connect` — so the admin section name matches the public route it controls, same reasoning 0033 used.
