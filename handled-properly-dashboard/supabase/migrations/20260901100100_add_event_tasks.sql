-- Event Task: an admin-authored, client-visible unit of work on an Event.
-- Deliberately separate from Assignment (see CONTEXT.md) — no assignee (the
-- Roster it'd be drawn from doesn't include Clients), none of Assignment's
-- staff-only fields, and its own status enum since there's no admin/staff
-- split in who moves it: only the admin does.
create type event_task_status as enum ('not_started', 'in_progress', 'blocked', 'done');

create table event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  title text not null,
  description text,
  status event_task_status not null default 'not_started',
  created_at timestamptz not null default now()
);
create index event_tasks_event_idx on event_tasks (event_id);

-- Unlike assignment_comments, this is single-author (admin only) — Clients
-- read their Event Tasks, they never post to them.
create table event_task_updates (
  id uuid primary key default gen_random_uuid(),
  event_task_id uuid not null references event_tasks (id) on delete cascade,
  author_admin_id uuid not null references admins (id),
  body text not null,
  created_at timestamptz not null default now()
);
create index event_task_updates_task_idx on event_task_updates (event_task_id, created_at);

alter table event_tasks enable row level security;
alter table event_task_updates enable row level security;

create policy admin_all on event_tasks for all
  using (is_admin()) with check (is_admin());
create policy admin_all on event_task_updates for all
  using (is_admin()) with check (is_admin());

create policy client_select_own_event_tasks on event_tasks for select
  using (is_client_for_event(event_id));

create policy client_select_own_event_task_updates on event_task_updates for select
  using (
    event_task_id in (
      select id from event_tasks where is_client_for_event(event_id)
    )
  );
