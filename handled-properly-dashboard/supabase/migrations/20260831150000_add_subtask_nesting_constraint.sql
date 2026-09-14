-- A Subtask (an Assignment with parent_assignment_id set) cannot itself
-- have Subtasks — nesting is capped at one level below a top-level
-- Assignment. See docs/adr/0012-subtasks-cannot-have-subtasks.md for why.
--
-- This can't be a `check` constraint (like assignment_dependencies_not_self)
-- because the rule depends on another row — the prospective parent's own
-- parent_assignment_id — which a row-local check can't see. This is the
-- first trigger in this schema (every other structural rule so far is
-- either a `check` constraint or lives inside an RPC like
-- set_assignment_status/pickup_assignment) — a trigger is needed here
-- specifically because createAssignment/updateAssignment write to
-- `assignments` via a plain insert/update, not through an RPC chokepoint.
create function prevent_nested_subtasks()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.parent_assignment_id is not null then
    if exists (
      select 1 from assignments
      where id = new.parent_assignment_id
        and parent_assignment_id is not null
    ) then
      raise exception 'A subtask cannot itself have subtasks.';
    end if;
  end if;
  return new;
end;
$$;

-- `update of parent_assignment_id` is defense-in-depth: no UI path
-- currently changes an existing assignment's parent after creation
-- (updateAssignment's .update() payload never includes this column), so in
-- practice only the insert branch fires today.
create trigger assignments_no_nested_subtasks
before insert or update of parent_assignment_id on assignments
for each row execute function prevent_nested_subtasks();
