-- Vendor stops being its own role/table — it's now just "a Contact on this
-- Event's Vendor list," a direct Contact-to-Event link like Roster/
-- Attendance. There's no longer a standalone place to manage or edit a
-- Vendor record (the admin Vendors page is gone, and Edit Vendors just
-- picks Contacts), so keeping a separate table with its own id and Category
-- column no longer earns its keep — Category is dropped along with it
-- rather than left homeless.
alter table event_vendors add column contact_id uuid references contacts (id) on delete cascade;

update event_vendors ev
set contact_id = v.contact_id
from vendors v
where v.id = ev.vendor_id;

alter table event_vendors alter column contact_id set not null;

alter table event_vendors drop constraint event_vendors_pkey;
alter table event_vendors add primary key (event_id, contact_id);

drop index if exists event_vendors_vendor_idx;
create index event_vendors_contact_idx on event_vendors (contact_id);

-- Both of these policies join through event_vendors.vendor_id, so they have
-- to go before that column can be dropped. client_select_vendor_contacts is
-- recreated below against contact_id directly; client_select_own_vendors
-- (on vendors itself) isn't, since the whole table goes with it.
drop policy client_select_vendor_contacts on contacts;
drop policy client_select_own_vendors on vendors;

alter table event_vendors drop column vendor_id;

drop table vendors;

create policy client_select_vendor_contacts on contacts for select
  using (
    id in (
      select contact_id from event_vendors where is_client_for_event(event_id)
    )
  );
