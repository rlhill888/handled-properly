-- The /about page grows from 5 pieces (hero, story, differentiators,
-- testimonial, CTA) into a fixed set of 7 named sections -- Hero/
-- Introduction, Our Story, Who We Are, What We Do, Our Mission, Our
-- Vision, Our Values -- each with its own admin-editable text and exactly
-- one admin-editable image, plus a closing CTA. See
-- docs/adr/0035-about-page-seven-sections.md.

-- Testimonial is dropped -- it isn't one of the requested sections, and it
-- was only ever a placeholder (no real quote was ever entered). CTA stays
-- -- every other marketing page on this site ends on one, and dropping
-- the page's only remaining action would leave it with no next step.
alter table site_about_page
  drop column testimonial_quote,
  drop column testimonial_attribution;

alter table site_about_page
  add column hero_intro text not null default '',
  add column hero_tagline text not null default '',
  add column who_we_are_body text not null default '',
  add column who_we_are_image_path text,
  add column what_we_do_body text not null default '',
  add column what_we_do_image_path text,
  add column mission_body text not null default '',
  add column mission_image_path text,
  add column vision_body text not null default '',
  add column vision_image_path text,
  -- One section-level image for "Our Values" (a grid of short title +
  -- description cards, not one image per card -- see
  -- site_about_values/AboutValue below).
  add column values_image_path text;

update site_about_page
set
  hero_intro = 'Handled Properly is an event-staffing and coordination platform for people planning events who don''t want to run the day off a group chat, a spreadsheet, and a stack of sticky notes.',
  hero_tagline = 'Every detail, handled — from the first idea to the final toast.',
  who_we_are_body = 'We''re a small team of event planners, coordinators, and builders who got tired of watching solid plans nearly fall apart over things that had nothing to do with the event itself — a missed text, a spreadsheet nobody updated, a roster only one person had access to.

What brings us together is the same thing that brought us to this work in the first place: we care about the day actually going right, not just the plan looking right on paper.',
  what_we_do_body = 'We provide the portal that keeps an event''s moving pieces in one place — staff scheduling, vendor coordination, task assignments, timelines, and client updates — for clients planning an event and the staff running it.

Whether it''s a wedding, a corporate event, a gala, or something in between, the same platform carries the plan from the first inquiry through setup, service, and breakdown.',
  mission_body = 'We exist because too many good events nearly go wrong for reasons that have nothing to do with the vision, the vendors, or the budget — they go wrong because nobody had one shared, reliable place to coordinate from.

Our mission is to make that failure mode obsolete: to give everyone involved in an event the same clear picture of what''s happening and who''s responsible for it, so the plan and the day actually match.',
  vision_body = 'We want event coordination to stop being something people route around with group chats and spreadsheets, and start being something a single, dependable system just handles.

As we grow, that means covering more of the event lifecycle — more event types, more of the vendor relationship, more of the day-of coordination — without losing the clarity that got us here.'
where id = 1;

-- Our Values: renamed from "Differentiators" (site_about_differentiators)
-- now that this page has a dedicated Values section rather than a
-- standalone "what makes us different" grid -- same shape (title + short
-- description, admin-managed count via sort_order), just reframed as
-- principles rather than competitive claims.
alter table site_about_differentiators rename to site_about_values;
alter index site_about_differentiators_sort_idx rename to site_about_values_sort_idx;

update site_about_values set
  title = 'One shared source of truth',
  description = 'Staff, clients, and vendors should all see the same schedule and the same updates — never their own separate copy that quietly drifts out of date.'
where sort_order = 0;

update site_about_values set
  title = 'Show up for the whole day, not just the plan',
  description = 'A good plan isn''t the finish line. We stay through setup, service, and breakdown, not just the weeks of planning before it.'
where sort_order = 1;

update site_about_values set
  title = 'Clear roles, no guessing',
  description = 'Every person on site should know exactly what they''re responsible for and when — not a group chat someone has to keep re-explaining.'
where sort_order = 2;
