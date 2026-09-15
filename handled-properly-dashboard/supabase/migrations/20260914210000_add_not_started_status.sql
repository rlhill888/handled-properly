-- Reverses 20260901190000_remove_ready_assignment_status.sql and
-- 20260901200000_remove_not_started_event_task_status.sql at the user's
-- request: adds "Not Started" back as a status for both Assignments and
-- Event Tasks. Postgres can't add a value to an enum and use it
-- transactionally the same way it can other DDL, so this follows the same
-- rename-old-type + create-new-type + migrate-column + recreate-function
-- pattern as the migrations it reverses. Existing rows keep their current
-- status; only new rows default to 'not_started'.

alter table assignments alter column status drop default;

alter type assignment_status rename to assignment_status_old;
create type assignment_status as enum ('not_started', 'in_progress', 'blocked', 'done');

alter table assignments
  alter column status type assignment_status
  using status::text::assignment_status;

alter table assignments alter column status set default 'not_started';

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

alter table event_tasks alter column status drop default;

alter type event_task_status rename to event_task_status_old;
create type event_task_status as enum ('not_started', 'in_progress', 'blocked', 'done');

alter table event_tasks
  alter column status type event_task_status
  using status::text::event_task_status;

alter table event_tasks alter column status set default 'not_started';

drop function set_event_task_status(uuid, event_task_status_old);

create function set_event_task_status(target_event_task_id uuid, new_status event_task_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  unmet_count int;
begin
  if not is_admin() then
    raise exception 'not authorized to update this event task';
  end if;

  if new_status in ('in_progress', 'done') then
    select count(*) into unmet_count
    from request_dependencies rd
    join requests r on r.id = rd.request_id
    where rd.event_task_id = target_event_task_id
      and r.fulfilled_at is null;

    if unmet_count > 0 then
      raise exception 'This event task is waiting on % request(s) to be fulfilled first.', unmet_count;
    end if;
  end if;

  update event_tasks set status = new_status where id = target_event_task_id;
end;
$$;

revoke execute on function set_event_task_status(uuid, event_task_status) from public, anon;
grant execute on function set_event_task_status(uuid, event_task_status) to authenticated;

drop type event_task_status_old;
