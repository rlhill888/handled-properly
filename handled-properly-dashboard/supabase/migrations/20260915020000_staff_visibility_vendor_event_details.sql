-- Lets rostered staff see a vendor's Vendor Event Detail (arrival/setup/
-- parking and the admin's notes), mirroring
-- 20260914010000_staff_visibility_vendor_needs.sql. Requested so staff
-- working an event can see the same admin notes the admin left about a
-- vendor, not just the vendor's own requested items. event_vendors and the
-- vendor's Contact row are already staff-visible from that earlier
-- migration; only vendor_event_details itself was missing a staff policy.
create policy staff_select_vendor_event_details on vendor_event_details for select
  using (is_on_roster(event_id));
