-- Content Block: an admin-stacked, reusable image/text section (see
-- CONTEXT.md and docs/adr/0018-four-content-block-types.md). Replaces the
-- fixed-shape editing model both tables had -- About drops its
-- headline/subheading/body/photo fields entirely (the page becomes wholly
-- block-based); Blog Post keeps its fixed metadata (title/slug/category/
-- event_date/excerpt/cover_image_path -- these drive the card grid, the
-- homepage featured grid, and SEO) and only its long-form body becomes
-- blocks.
--
-- Current live data is a blank About row and one placeholder-text Blog
-- Post -- a clean cutover, no real-content backfill needed.

alter table site_about_content add column blocks jsonb not null default '[]';
alter table site_about_content drop column headline;
alter table site_about_content drop column subheading;
alter table site_about_content drop column body;
alter table site_about_content drop column photo_path;

alter table site_blog_posts add column blocks jsonb not null default '[]';
alter table site_blog_posts drop column body;
