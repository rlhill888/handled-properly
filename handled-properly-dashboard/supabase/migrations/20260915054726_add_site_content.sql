-- Public marketing site content, admin-managed via /portal/admin/website.
-- Deliberately separate from every operational table above: these are
-- publicly-readable rows with no Contact/Client/Event relationship. Public
-- pages read them through the service-role client (see
-- src/lib/data/site-content.ts), matching how client_applications is
-- written by the service-role client in get-started/actions.ts -- anon
-- gets no table grants in this schema (see the initial-schema migration's
-- RLS comment), so admin_all (is_admin()) is the only policy needed here;
-- there's no anon/authenticated policy to add.

-- Trusted By: name + optional logo shown in the homepage strip.
create table site_trusted_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_path text,
  created_at timestamptz not null default now()
);

-- Blog Post: an admin-authored write-up of a past event, shown on /events
-- and (when is_featured) on the homepage. NOT fk'd to `events` (the
-- internal staffing record) -- see docs/adr/0017-blog-posts-are-not-linked-to-events.md.
create table site_blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text,
  event_date date,
  excerpt text,
  body text not null,
  cover_image_path text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);
create index site_blog_posts_featured_idx on site_blog_posts (is_featured, created_at desc);

-- About page content: a singleton row (id pinned to 1).
create table site_about_content (
  id int primary key default 1 check (id = 1),
  headline text not null default '',
  subheading text,
  body text not null default '',
  photo_path text,
  updated_at timestamptz not null default now()
);
insert into site_about_content (id) values (1);

alter table site_trusted_partners enable row level security;
alter table site_blog_posts enable row level security;
alter table site_about_content enable row level security;

create policy admin_all on site_trusted_partners for all using (is_admin()) with check (is_admin());
create policy admin_all on site_blog_posts for all using (is_admin()) with check (is_admin());
create policy admin_all on site_about_content for all using (is_admin()) with check (is_admin());

-- Public bucket (like email-assets, unlike the private event-header-images)
-- -- these images are embedded in plain public pages via a stable <img
-- src>, with no session available to mint a signed URL against.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
