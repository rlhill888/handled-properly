-- Clients can now log in (see docs/adr/0013-clients-can-log-in.md) — this
-- mirrors event_staff's auth shape exactly: an auth_user_id set by an admin
-- invite, an invite_status lifecycle, and a self-service activation RPC.
create type client_invite_status as enum ('invited', 'active', 'revoked');

alter table clients add column auth_user_id uuid unique references auth.users (id) on delete set null;
alter table clients add column invite_status client_invite_status not null default 'invited';
alter table clients add column invited_at timestamptz not null default now();
create index clients_auth_user_idx on clients (auth_user_id);

create function current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from clients where auth_user_id = auth.uid();
$$;

-- Not roster-based, unlike is_on_roster — a Client owns an Event directly
-- via events.client_id, they're never added to a Roster.
create function is_client_for_event(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from events
    where id = target_event_id
      and client_id = current_client_id()
  );
$$;

create policy client_select_own on clients for select
  using (auth_user_id = auth.uid());

create policy client_select_own_contact on contacts for select
  using (id = (select contact_id from clients where auth_user_id = auth.uid()));

create policy client_select_own_events on events for select
  using (is_client_for_event(id));

-- Mirrors activate_own_staff_account exactly — event_staff/clients have no
-- UPDATE policy for their own role (only SELECT), so flipping invite_status
-- to 'active' after set-password needs this narrow, self-scoped RPC.
create function activate_own_client_account()
returns void
language sql
security definer
set search_path = public
as $$
  update clients set invite_status = 'active' where auth_user_id = auth.uid();
$$;

revoke execute on function activate_own_client_account() from public, anon;
grant execute on function activate_own_client_account() to authenticated;
