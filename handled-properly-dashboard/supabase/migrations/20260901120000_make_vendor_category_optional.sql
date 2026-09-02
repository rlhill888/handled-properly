-- Vendors can now be created by quick-adding an existing Contact from the
-- Edit Vendors modal's contact search, which doesn't collect a Category —
-- only the "Add a New Vendor" form (which still requires one) does. Category
-- stays a real column on Vendor, just no longer mandatory at creation.
alter table vendors alter column category drop not null;
