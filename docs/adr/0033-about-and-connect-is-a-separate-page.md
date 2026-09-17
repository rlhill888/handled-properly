---
status: accepted
---

# About & Connect is a separate page from /about, not a replacement for it

[`0032`](./0032-about-page-editable-landing-page.md) made `/about` admin-editable again — headshot, about text, social links, featured items — reasoning that this replaced what `/about` needed to be. It turned out the admin wanted both: the original hand-coded `/about` from [`0031`](./0031-about-page-hand-coded-not-block-driven.md) (headline, story, differentiators, testimonial, CTA) *and* a bio-link-style page for a headshot, a short bio, social icon buttons, and promoted items — not one page trying to be both.

Rather than contorting `/about` to serve both purposes, the admin-editable content from 0032 moved to a new route, `/about-and-connect`, and `/about` reverted to exactly 0031's original hand-coded JSX/CSS. The data model is untouched — `site_about_content`, `site_social_links`, `site_featured_items`, and the admin editor all work exactly as 0032 described, just read by `/about-and-connect/page.tsx` instead of `/about/page.tsx`. The admin editor moved with it: `/portal/admin/website/about` is now `/portal/admin/website/about-and-connect`, relabeled "About & Connect" throughout (website hub card, page heading), so the admin section a person edits and the public route it controls stay named the same thing.

**No Navbar on `/about-and-connect`.** This page is meant to work as a standalone bio-link-style page — the kind of link shared directly (e.g. in a social media bio), landed on from outside the site rather than browsed to from within it — so it deliberately omits the site's `Navbar` component that every other public page renders. `Footer` stays (brand mark + copyright, no navigation links of its own, so it doesn't undercut the "standalone" intent). There's no other route (this site's `Navbar`, `/about`, anywhere else) that links to `/about-and-connect` — it's reached by its URL directly, not through in-site browsing, matching how a bio-link page is normally shared and visited.
