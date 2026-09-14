-- An Assignment can depend on other Assignments (same Event) that must
-- reach Status 'done' before it — deliberately separate from Status itself:
-- Status stays the existing 4-stage lifecycle any Roster member sets by
-- hand; a dependency is a structural relationship the admin wires up (like
-- Sub-assignments), enforced only when a Roster member tries to move a
-- dependent Assignment's Status into 'in_progress'/'done' — not by silently
-- flipping its Status to 'blocked' behind their back.
create table assignment_dependencies (
  assignment_id uuid not null references assignments (id) on delete cascade,
  depends_on_assignment_id uuid not null references assignments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (assignment_id, depends_on_assignment_id),
  constraint assignment_dependencies_not_self check (assignment_id <> depends_on_assignment_id)
);
create index assignment_dependencies_depends_on_idx on assignment_dependencies (depends_on_assignment_id);

alter table assignment_dependencies enable row level security;

create policy admin_all on assignment_dependencies for all
  using (is_admin()) with check (is_admin());

create policy staff_select_rostered_assignment_dependencies on assignment_dependencies for select
  using (is_on_roster_for_assignment(assignment_id));

-- Re-created (not altered) to add the dependency gate. Admin's own status
-- writes (updateAssignment/updateAssignmentStatus in the admin actions
-- file) go through a plain table update, not this RPC, so they're
-- deliberately unaffected — this only gates the staff path
-- (staffSetStatus), which always calls this function.
create or replace function set_assignment_status(target_assignment_id uuid, new_status assignment_status)
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
