-- Comments on an Assignment: a lightweight, chronological note either the
-- admin or any Roster member on the Assignment's Event can leave. Mirrors
-- the dual-author shape of `messages` (see the initial schema migration) —
-- exactly one of author_admin_id/author_event_staff_id is set — but attaches
-- directly to an assignment_id rather than going through a Conversation, and
-- (unlike messages, which require opting into a Conversation) any Roster
-- member for the assignment's Event can read and post, matching how staff
-- already see every Assignment for events they're rostered on.
create table assignment_comments (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments (id) on delete cascade,
  author_admin_id uuid references admins (id),
  author_event_staff_id uuid references event_staff (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint assignment_comments_single_author check (
    (author_admin_id is not null)::int + (author_event_staff_id is not null)::int = 1
  )
);
create index assignment_comments_assignment_idx on assignment_comments (assignment_id, created_at);

alter table assignment_comments enable row level security;

create policy admin_all on assignment_comments for all
  using (is_admin()) with check (is_admin());

create policy staff_select_rostered_assignment_comments on assignment_comments for select
  using (is_on_roster_for_assignment(assignment_id));

create policy staff_insert_assignment_comments on assignment_comments for insert
  with check (
    author_event_staff_id = current_event_staff_id()
    and is_on_roster_for_assignment(assignment_id)
  );
