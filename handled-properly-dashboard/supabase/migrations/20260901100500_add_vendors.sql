-- Vendor: a role attached to a Contact, mirroring Client/Event Staff's
-- shape (its own table, contact_id unique to a Contact) but with no auth —
-- a Vendor never logs in. Carries a fixed category (e.g. "Caterer") on the
-- Vendor record itself, set once, not per-Event.
create table vendors (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts (id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now()
);

-- The explicit set of Vendors the admin has added to a specific Event,
-- visible to that Event's Client — same shape as roster_entries, but for
-- Vendors instead of Event Staff. Configured per Event only; accepting a
-- Client Application never creates this, since no Event exists yet then.
create table event_vendors (
  event_id uuid not null references events (id) on delete cascade,
  vendor_id uuid not null references vendors (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (event_id, vendor_id)
);
create index event_vendors_vendor_idx on event_vendors (vendor_id);

alter table vendors enable row level security;
alter table event_vendors enable row level security;

create policy admin_all on vendors for all
  using (is_admin()) with check (is_admin());
create policy admin_all on event_vendors for all
  using (is_admin()) with check (is_admin());

create policy client_select_event_vendors on event_vendors for select
  using (is_client_for_event(event_id));

create policy client_select_own_vendors on vendors for select
  using (
    id in (
      select vendor_id from event_vendors where is_client_for_event(event_id)
    )
  );

-- A second, additive SELECT policy on contacts (Postgres OR's permissive
-- policies together — the same pattern client_select_own_contact and
-- staff_select_own_contact already rely on) so a Client can read the
-- Contact info (name/phone/email) behind a Vendor on their Event's list.
create policy client_select_vendor_contacts on contacts for select
  using (
    id in (
      select v.contact_id
      from vendors v
      join event_vendors ev on ev.vendor_id = v.id
      where is_client_for_event(ev.event_id)
    )
  );
