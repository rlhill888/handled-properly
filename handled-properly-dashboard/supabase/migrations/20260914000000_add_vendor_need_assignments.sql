-- Lets an admin turn one or more Vendor Needs (items a vendor requested)
-- into -- or attach them to -- the Assignment doing the work to fulfill
-- them. Mirrors event_task_assignments' shape (a plain many-to-many join,
-- admin-managed, purely informational -- it never gates Assignment
-- status). Admin-only, no staff/vendor select policy: vendor_needs itself
-- has no staff-visible policy, and vendors only manage their own needs, not
-- Assignments.
create table vendor_need_assignments (
  vendor_need_id uuid not null references vendor_needs (id) on delete cascade,
  assignment_id uuid not null references assignments (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (vendor_need_id, assignment_id)
);
create index vendor_need_assignments_assignment_idx on vendor_need_assignments (assignment_id);

alter table vendor_need_assignments enable row level security;

create policy admin_all on vendor_need_assignments for all
  using (is_admin()) with check (is_admin());
