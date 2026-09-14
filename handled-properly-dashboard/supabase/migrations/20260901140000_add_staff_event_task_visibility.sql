-- Event Tasks were Client-only until now — Event Staff can now see the same
-- read-only board/detail the Client sees for an Event they're rostered on
-- (a "View Event Tasks" button next to "View Assignments"), mirroring how
-- staff_select_rostered_assignment_comments already gates staff read access
-- via is_on_roster. Still no staff write path: only the admin ever creates,
-- edits, or posts an Update to an Event Task.
create policy staff_select_rostered_event_tasks on event_tasks for select
  using (is_on_roster(event_id));

create policy staff_select_rostered_event_task_updates on event_task_updates for select
  using (
    event_task_id in (
      select id from event_tasks where is_on_roster(event_id)
    )
  );
