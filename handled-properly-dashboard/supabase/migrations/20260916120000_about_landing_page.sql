-- The /about page becomes an admin-customizable landing page again -- but
-- with a fixed structure (headshot, about text, social links, featured
-- items) rather than generic Content Blocks, so the bespoke, animated
-- design ADR-0031 asked for stays intact while the specific fields the
-- admin wants to edit become editable again. See
-- docs/adr/0032-about-page-editable-landing-page.md, which supersedes 0031.

-- The old Content Block array is dropped -- About is no longer
-- block-composed. The admin had already written real copy into it via the
-- still-live-but-disconnected editor (two Title blocks' supportingText);
-- that text is carried forward into the new about_body field below rather
-- than discarded, since it's real writing, not placeholder content.
alter table site_about_content
  add column headshot_path text,
  add column about_body text not null default '';

update site_about_content
set about_body = 'We bring the moving pieces together, so you can focus on bringing people together. Handled Properly brings vendors, budgets, timelines, and your team into one place. From the first idea to the final detail, every part of your event stays connected.'
where id = 1;

alter table site_about_content drop column blocks;

-- Social Link: an icon button on the About page that opens an external
-- profile/page in a new tab. The icon itself is admin-uploaded (not a
-- fixed platform list) since we don't know in advance which platforms the
-- admin wants to link -- same reasoning as Trusted Partner's admin-uploaded
-- logo.
create table site_social_links (
  id uuid primary key default gen_random_uuid(),
  icon_path text not null,
  url text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- Featured Item: something the admin sells or promotes on the About page --
-- an image, title, description, and an optional outbound link. Distinct
-- from Blog Post (a write-up of a past event) and Trusted Partner (a
-- partner's name/logo, no description or link).
create table site_featured_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_path text,
  link_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index site_social_links_sort_idx on site_social_links (sort_order);
create index site_featured_items_sort_idx on site_featured_items (sort_order);

alter table site_social_links enable row level security;
alter table site_featured_items enable row level security;

create policy admin_all on site_social_links for all using (is_admin()) with check (is_admin());
create policy admin_all on site_featured_items for all using (is_admin()) with check (is_admin());
