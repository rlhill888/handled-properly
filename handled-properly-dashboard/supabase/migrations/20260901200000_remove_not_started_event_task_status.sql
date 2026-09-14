-- Removes the "Not Started" Event Task status, mirroring
-- 20260901190000_remove_ready_assignment_status.sql for Assignments — same
-- reasoning: an Event Task is simply in progress once it exists, there's
-- no separate "waiting to start" state anymore. Postgres can't drop an
-- enum value in place, so this recreates the type with the same 3 values
-- Assignment now has (in_progress/blocked/done), migrates existing
-- 'not_started' rows to 'in_progress' first, and re-creates
-- set_event_task_status against the new type (its dependency-gate body
-- and grants are otherwise unchanged from
-- 20260901100300_add_request_dependencies.sql).
update event_tasks set status = 'in_progress' where status = 'not_started';

alter table event_tasks alter column status drop default;

alter type event_task_status rename to event_task_status_old;
create type event_task_status as enum ('in_progress', 'blocked', 'done');

alter table event_tasks
  alter column status type event_task_status
  using status::text::event_task_status;

alter table event_tasks alter column status set default 'in_progress';

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
