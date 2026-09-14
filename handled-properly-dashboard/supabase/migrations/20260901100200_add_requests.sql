-- Request: an admin-authored ask directed at a Client, scoped to one Event.
-- The Client's analog of an Assignment, but a separate table — Assignment's
-- Roster-drawn assignee model doesn't fit a Client, and a Request needs
-- file-upload capability Assignment doesn't have. No status enum: a Request
-- is either fulfilled or not, tracked by fulfilled_at.
create type fulfillment_setting as enum ('auto', 'manual_review');

create table requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  requires_file boolean not null default false,
  fulfillment_setting fulfillment_setting not null default 'manual_review',
  file_path text,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  -- 'auto' only makes sense when a file is actually required — a Request
  -- with no file has no upload event to auto-fulfill on, so it's always
  -- fulfilled by the admin manually.
  constraint requests_auto_requires_file
    check (fulfillment_setting = 'manual_review' or requires_file)
);
create index requests_event_idx on requests (event_id);

alter table requests enable row level security;

create policy admin_all on requests for all
  using (is_admin()) with check (is_admin());

create policy client_select_own_requests on requests for select
  using (is_client_for_event(event_id));

-- Deliberately no client UPDATE/INSERT policy — the Client's one write path
-- (uploading a file) goes through a Server Action using the service-role
-- client, same as every other client-writable path in this app.
