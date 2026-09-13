-- Removes the "Ready to Work" status entirely. Postgres can't drop a value
-- from an enum in place, so this migrates existing 'ready' rows to
-- 'in_progress' (there's no more separate "waiting to start" state once
-- 'ready' is gone — an assignment is simply in progress once it exists),
-- then swaps the column over to a freshly created 3-value type
-- (in_progress/blocked/done) and re-creates set_assignment_status against
-- it (its dependency-gate body is otherwise unchanged from
-- 20260831140000_add_assignment_dependencies.sql).
update assignments set status = 'in_progress' where status = 'ready';

alter table assignments alter column status drop default;

alter type assignment_status rename to assignment_status_old;
create type assignment_status as enum ('in_progress', 'blocked', 'done');

alter table assignments
  alter column status type assignment_status
  using status::text::assignment_status;

alter table assignments alter column status set default 'in_progress';

drop function set_assignment_status(uuid, assignment_status_old);

create function set_assignment_status(target_assignment_id uuid, new_status assignment_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  unmet_count int;
begin
  if not (is_admin() or is_on_roster_for_assignment(target_assignment_id)) then
    raise exception 'not authorized to update this assignment';
  end if;

  if new_status in ('in_progress', 'done') then
    select count(*) into unmet_count
    from assignment_dependencies ad
    join assignments dep on dep.id = ad.depends_on_assignment_id
    where ad.assignment_id = target_assignment_id
      and dep.status <> 'done';

    if unmet_count > 0 then
      raise exception 'This assignment is waiting on % other assignment(s) to be completed first.', unmet_count;
    end if;
  end if;

  update assignments set status = new_status where id = target_assignment_id;
end;
$$;

drop type assignment_status_old;
