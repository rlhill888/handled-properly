-- Vendors can now log in (see docs/adr/0016-vendors-can-log-in.md). This
-- reverses 20260901222405_drop_vendors_table.sql, which removed the vendors
-- table because a Vendor was purely a Contact-on-event_vendors link with no
-- fields of its own. The Vendor Portal needs a real per-event checklist
-- (arrival/setup/parking/photo) and an optional auto-expiring login, so
-- Vendor gets a dedicated table again — this time with an auth shape that
-- mirrors event_staff/clients exactly (contact_id unique, auth_user_id,
-- invite_status, invited_at).
create type vendor_invite_status as enum ('invited', 'active', 'revoked');

create table vendors (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts (id) on delete cascade,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  invite_status vendor_invite_status not null default 'invited',
  invited_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index vendors_auth_user_idx on vendors (auth_user_id);

-- The admin-authored, per-event checklist a Vendor sees: arrival time and
-- location, an optional setup time/location and location photo, parking
-- instructions, and the admin's own private notes (never shown to the
-- Vendor). One row per event_vendors pairing — a Vendor's arrival/setup
-- details are specific to the event, not the Vendor identity itself.
create table vendor_event_details (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  arrival_time timestamptz,
  arrival_location text,
  setup_time timestamptz,
  setup_location text,
  location_photo_path text,
  parking_instructions text,
  admin_notes text,
  -- When set, this Vendor's portal access to this event is revoked at read
  -- time (via is_vendor_for_event below) once the event is Completed or its
  -- ends_at has passed — no cron job, computed live like every other
  -- event-status check in this app.
  access_expires_after_event boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, contact_id),
  foreign key (event_id, contact_id) references event_vendors (event_id, contact_id) on delete cascade
);

alter table vendors enable row level security;
alter table vendor_event_details enable row level security;

create policy admin_all on vendors for all
  using (is_admin()) with check (is_admin());
create policy admin_all on vendor_event_details for all
  using (is_admin()) with check (is_admin());

create function current_vendor_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from vendors where auth_user_id = auth.uid();
$$;

-- Roster-adjacent but not roster-based, like is_client_for_event — a Vendor
-- is on an Event via event_vendors, not a Roster. Also gates on invite_status
-- and the access_expires_after_event/event-ended check described above, so
-- RLS alone is enough to lock a Vendor out once their access has lapsed.
create function is_vendor_for_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from vendors v
    join event_vendors ev on ev.contact_id = v.contact_id and ev.event_id = target_event_id
    join events e on e.id = ev.event_id
    left join vendor_event_details ved on ved.event_id = ev.event_id and ved.contact_id = ev.contact_id
    where v.auth_user_id = auth.uid()
      and v.invite_status = 'active'
      and not (
        coalesce(ved.access_expires_after_event, false)
        and (e.status = 'completed' or (e.ends_at is not null and e.ends_at < now()))
      )
  );
$$;

create policy vendor_select_own on vendors for select
  using (auth_user_id = auth.uid());

create policy vendor_select_own_contact on contacts for select
  using (id = (select contact_id from vendors where auth_user_id = auth.uid()));

create policy vendor_select_own_events on events for select
  using (is_vendor_for_event(id));

create policy vendor_select_own_details on vendor_event_details for select
  using (
    is_vendor_for_event(event_id)
    and contact_id = (select contact_id from vendors where auth_user_id = auth.uid())
  );

-- Mirrors activate_own_client_account exactly — vendors has no UPDATE policy
-- for its own row (only SELECT), so flipping invite_status to 'active' after
-- set-password needs this narrow, self-scoped RPC.
create function activate_own_vendor_account()
returns void
language sql
security definer
set search_path = public
as $$
  update vendors set invite_status = 'active' where auth_user_id = auth.uid();
$$;

revoke execute on function activate_own_vendor_account() from public, anon;
grant execute on function activate_own_vendor_account() to authenticated;
