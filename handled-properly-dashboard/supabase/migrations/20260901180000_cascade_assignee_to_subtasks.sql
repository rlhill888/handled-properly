-- Whoever is assigned to a parent Assignment is automatically also assigned
-- to all of its Subtasks, so the same person handles the whole unit of
-- work. Implemented as a trigger (not baked into pickup_assignment or any
-- one admin action) because assignment_assignees rows are inserted from
-- four independent places today (pickup_assignment, createAssignment,
-- updateAssignment, updateAssignmentAssignees) — a trigger covers all of
-- them, plus any future insert path, in one place.
--
-- Safe against recursion: Subtasks are capped at one level of nesting (see
-- 0012-subtasks-cannot-have-subtasks), so cascading from a subtask's own
-- assignee-insert finds zero children and no-ops. Additive only (on
-- conflict do nothing) — never removes existing subtask assignees, and
-- does not cascade upward (assigning someone to a subtask directly does
-- NOT assign them to the parent).
create function cascade_assignee_to_subtasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into assignment_assignees (assignment_id, event_staff_id, assigned_via)
  select a.id, new.event_staff_id, new.assigned_via
  from assignments a
  where a.parent_assignment_id = new.assignment_id
  on conflict (assignment_id, event_staff_id) do nothing;
  return new;
end;
$$;

create trigger assignment_assignees_cascade_to_subtasks
after insert on assignment_assignees
for each row
execute function cascade_assignee_to_subtasks();

-- Backfill: apply the same rule retroactively so existing parent/subtask
-- assignee data is consistent immediately, not only for assignments
-- picked up/assigned from now on.
insert into assignment_assignees (assignment_id, event_staff_id, assigned_via)
select sub.id, aa.event_staff_id, aa.assigned_via
from assignment_assignees aa
join assignments sub on sub.parent_assignment_id = aa.assignment_id
on conflict (assignment_id, event_staff_id) do nothing;
