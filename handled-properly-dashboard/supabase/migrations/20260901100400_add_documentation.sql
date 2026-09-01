-- Documentation: an admin-uploaded file with a title and description, made
-- visible to a Client. Scoped to exactly one Event — never reused across
-- Events, unlike Form.
create table documentation (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text,
  file_path text not null,
  created_at timestamptz not null default now()
);
create index documentation_event_idx on documentation (event_id);

alter table documentation enable row level security;

create policy admin_all on documentation for all
  using (is_admin()) with check (is_admin());

create policy client_select_own_documentation on documentation for select
  using (is_client_for_event(event_id));
