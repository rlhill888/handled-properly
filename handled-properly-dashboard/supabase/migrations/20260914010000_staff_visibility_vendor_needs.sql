-- Lets rostered staff see the Vendor Requested Items now shown on the
-- Assignment card (AssignmentCard/StaffAssignmentCard's "Vendor Requested
-- Items" accordion). Four things were admin/vendor/client-only until now
-- and block that read under RLS even via an embedded select:
--   1. event_vendors itself — no staff policy existed at all, so without
--      this the subquery below would silently return no rows for staff
--      (a permissive-policy subquery only sees what the querying role's
--      own RLS on that table already lets it see).
--   2. the vendor's own Contact row (name) — mirrors
--      client_select_vendor_contacts, scoped to roster instead of client.
--   3. vendor_needs itself (the item text).
--   4. vendor_need_assignments (the link to the Assignment), gated the same
--      way event_task_assignments' staff policy is: through the Assignment
--      side, since is_on_roster(event_id) isn't directly available on this
--      join table.
create policy staff_select_event_vendors on event_vendors for select
  using (is_on_roster(event_id));

create policy staff_select_vendor_contacts on contacts for select
  using (
    id in (
      select contact_id from event_vendors where is_on_roster(event_id)
    )
  );

create policy staff_select_rostered_vendor_needs on vendor_needs for select
  using (is_on_roster(event_id));

create policy staff_select_rostered_vendor_need_assignments on vendor_need_assignments for select
  using (
    assignment_id in (
      select id from assignments where is_on_roster(event_id)
    )
  );
