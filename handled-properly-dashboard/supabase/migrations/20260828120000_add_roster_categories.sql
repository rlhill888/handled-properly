-- Per-event roster categories: each event defines its own set of
-- categories (e.g. "Security", "Bar Staff") and tags roster members with
-- them. Mirrors the categories/contact_categories pattern but scoped to a
-- single event instead of being global.

create table roster_categories (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (event_id, name)
);
create index roster_categories_event_idx on roster_categories (event_id);

create table roster_entry_categories (
  event_staff_id uuid not null references event_staff (id) on delete cascade,
  category_id uuid not null references roster_categories (id) on delete cascade,
  primary key (event_staff_id, category_id)
);
create index roster_entry_categories_category_idx on roster_entry_categories (category_id);

alter table roster_categories enable row level security;
alter table roster_entry_categories enable row level security;

create policy admin_all on roster_categories for all using (is_admin()) with check (is_admin());
create policy admin_all on roster_entry_categories for all using (is_admin()) with check (is_admin());
