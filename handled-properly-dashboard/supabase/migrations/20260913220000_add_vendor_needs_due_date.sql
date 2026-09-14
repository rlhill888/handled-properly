-- An optional, admin-set cutoff for when Vendors must submit their Vendor
-- Needs by. Lives directly on events, matching every other per-event admin
-- setting (header_image_path, staff_can_start_conversations) rather than a
-- separate settings table. Null means no deadline -- vendors can add Needs
-- at any time, same as today.
alter table events add column vendor_needs_due_date timestamptz;
