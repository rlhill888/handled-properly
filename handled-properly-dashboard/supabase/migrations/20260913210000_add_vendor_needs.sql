-- A Vendor Need is the reverse of Vendor Event Detail: instead of the admin
-- telling the Vendor what they need to know (arrival/setup/parking), the
-- Vendor tells the admin what they need for the event (e.g. "2 six-foot
-- tables", "power outlet nearby"). Free-text, one row per item, so a Vendor
-- can add/remove individual items over time rather than editing one big
-- text blob.
create table vendor_needs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  item text not null,
  created_at timestamptz not null default now()
);
create index vendor_needs_event_idx on vendor_needs (event_id);

alter table vendor_needs enable row level security;

create policy admin_all on vendor_needs for all
  using (is_admin()) with check (is_admin());

create policy vendor_select_own_needs on vendor_needs for select
  using (
    is_vendor_for_event(event_id)
    and contact_id = (select contact_id from vendors where auth_user_id = auth.uid())
  );

create policy vendor_insert_own_needs on vendor_needs for insert
  with check (
    is_vendor_for_event(event_id)
    and contact_id = (select contact_id from vendors where auth_user_id = auth.uid())
  );

create policy vendor_delete_own_needs on vendor_needs for delete
  using (contact_id = (select contact_id from vendors where auth_user_id = auth.uid()));
