-- Lets an admin link an Event Task to one or more Assignments doing the
-- staff-side work behind it. Mirrors request_dependencies' shape (a plain
-- many-to-many join, admin-managed) but this relationship is purely
-- informational — unlike a Request Dependency, it never gates the Event
-- Task's Status.
create table event_task_assignments (
  event_task_id uuid not null references event_tasks (id) on delete cascade,
  assignment_id uuid not null references assignments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_task_id, assignment_id)
);
create index event_task_assignments_assignment_idx on event_task_assignments (assignment_id);

alter table event_task_assignments enable row level security;

create policy admin_all on event_task_assignments for all
  using (is_admin()) with check (is_admin());

-- Staff already read event_tasks and assignments for Events they're
-- rostered on (staff_select_rostered_event_tasks,
-- staff_select_rostered_assignments) — this lets them read the join
-- between the two under the same gate. No client policy: Assignment is a
-- staff-only concept Clients never see.
create policy staff_select_rostered_event_task_assignments on event_task_assignments for select
  using (
    event_task_id in (
      select id from event_tasks where is_on_roster(event_id)
    )
  );
