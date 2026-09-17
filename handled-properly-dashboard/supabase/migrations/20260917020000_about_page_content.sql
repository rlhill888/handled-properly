-- The /about page (the bespoke, hand-coded marketing page -- see
-- docs/adr/0031-about-page-hand-coded-not-block-driven.md) becomes
-- admin-editable again, but its specific fields rather than generic
-- Content Blocks, so the deliberate one-off design stays intact while the
-- admin can edit its copy/images. This is a different page (and a
-- different table) from site_about_content, which belongs to the separate
-- /about-and-connect bio-link page -- see
-- docs/adr/0034-about-page-editable-fields-not-blocks.md.

-- Singleton row (like site_about_content) holding the page's fixed
-- fields. headline is stored as newline-separated lines (currently three:
-- "Big moments." / "Small details." / "Handled properly.") -- the page
-- renders each on its own line and always mutes the last one, matching
-- the existing hard-coded headline's own styling. story_body is
-- paragraph(s) separated by a blank line, same convention
-- getAboutPageContent's about_body already uses for the /about-and-connect
-- page.
create table site_about_page (
  id int primary key default 1,
  headline text not null default '',
  hero_image_path text,
  story_body text not null default '',
  story_image_path text,
  -- Both default '' (not a fabricated quote) -- the public page falls
  -- back to the existing "add a real client quote here" placeholder
  -- treatment whenever testimonial_quote is blank, same as before this
  -- became admin-editable.
  testimonial_quote text not null default '',
  testimonial_attribution text not null default '',
  cta_heading text not null default '',
  cta_button_text text not null default '',
  updated_at timestamptz not null default now(),
  constraint site_about_page_singleton check (id = 1)
);

insert into site_about_page (
  id, headline, story_body, testimonial_quote, testimonial_attribution, cta_heading, cta_button_text
) values (
  1,
  'Big moments.
Small details.
Handled properly.',
  'Handled Properly is an event-staffing and coordination platform for people planning events who don''t want to run the day off a group chat, a spreadsheet, and a stack of sticky notes. We work with clients and event staff wherever the event is happening — weddings, corporate events, galas, and everything in between.

We built it after watching the same thing happen event after event: the plan was solid, the vendors were booked, and things still nearly fell apart because nobody had one shared place to see the roster, the timeline, and who was responsible for what. So we built one — a single portal where staff schedules, client updates, and task assignments live together, instead of scattered across texts and inboxes.',
  '',
  '',
  'Ready to plan your event?',
  'Plan Your Event'
);

-- Differentiator: one "what makes us different" card (title + short
-- description) on the /about page's grid. Admin-managed like Featured
-- Item/Social Link -- add, edit, remove, reorder -- rather than a fixed
-- count, even though the current design was written around three.
create table site_about_differentiators (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into site_about_differentiators (title, description, sort_order) values
  (
    'One shared source of truth',
    'Staff, clients, and vendors all see the same schedule and the same updates — not their own separate copy that drifts out of date.',
    0
  ),
  (
    'Built for the day of, not just the planning',
    'Most tools stop at the spreadsheet. We stay with you through setup, service, and breakdown, not just the weeks before.',
    1
  ),
  (
    'Clear roles, no guessing',
    'Every staff member knows exactly what they''re responsible for and when — not a group chat someone has to keep re-explaining.',
    2
  );

create index site_about_differentiators_sort_idx on site_about_differentiators (sort_order);

alter table site_about_page enable row level security;
alter table site_about_differentiators enable row level security;

create policy admin_all on site_about_page for all using (is_admin()) with check (is_admin());
create policy admin_all on site_about_differentiators for all using (is_admin()) with check (is_admin());
