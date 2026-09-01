-- A Request can block an Event Task (never the reverse, and Event Tasks
-- never depend on each other) — mirrors assignment_dependencies' shape:
-- the dependency gates the *transition* into in_progress/done, it doesn't
-- silently force the Event Task's own status to 'blocked'.
create table request_dependencies (
  event_task_id uuid not null references event_tasks (id) on delete cascade,
  request_id uuid not null references requests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_task_id, request_id)
);
create index request_dependencies_request_idx on request_dependencies (request_id);

alter table request_dependencies enable row level security;

create policy admin_all on request_dependencies for all
  using (is_admin()) with check (is_admin());

create policy client_select_own_request_dependencies on request_dependencies for select
  using (
    event_task_id in (
      select id from event_tasks where is_client_for_event(event_id)
    )
  );

-- Only the admin ever moves an Event Task's status — there's no staff/
-- roster path for Event Tasks at all, unlike Assignment (which has both an
-- admin direct-update path and a gated staff RPC path). That means this RPC
-- has to be the *only* way event_tasks.status changes, including from the
-- admin's own UI, or the dependency gate would never fire for anyone.
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
