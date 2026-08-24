-- Handled Properly: initial schema
-- Entities/relationships/cardinalities: ../../docs/domain-model.md
-- Canonical term definitions: ../../CONTEXT.md

-- ============================================================================
-- Enums
-- ============================================================================

create type assignment_status as enum ('ready', 'in_progress', 'blocked', 'done');
create type assignment_priority as enum ('low', 'medium', 'high');
create type pickup_setting as enum ('admin_only', 'open_pickup');
create type assigned_via as enum ('admin', 'pickup');
create type event_status as enum ('active', 'completed');
create type attendance_source as enum ('manual', 'form_submission');
create type staff_invite_status as enum ('invited', 'active', 'revoked');
create type email_template_source as enum ('manual', 'ai_draft');
create type form_field_type as enum ('text', 'email', 'tel', 'number', 'date', 'textarea', 'select', 'file');
create type form_attachment_target as enum ('event', 'assignment', 'email_send');

-- ============================================================================
-- Tables
-- ============================================================================

create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  created_at timestamptz not null default now()
);
create unique index contacts_email_unique_idx on contacts (lower(email));

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table contact_categories (
  contact_id uuid not null references contacts (id) on delete cascade,
  category_id uuid not null references categories (id) on delete cascade,
  primary key (contact_id, category_id)
);
create index contact_categories_category_idx on contact_categories (category_id);

create table clients (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts (id) on delete cascade,
  company_name text,
  notes text,
  created_at timestamptz not null default now()
);

create table event_staff (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null unique references contacts (id) on delete cascade,
  auth_user_id uuid unique references auth.users (id) on delete set null,
  invite_status staff_invite_status not null default 'invited',
  invited_at timestamptz not null default now()
);
create index event_staff_auth_user_idx on event_staff (auth_user_id);

create table admins (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade
);

create table event_series (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now()
);
create index event_series_client_idx on event_series (client_id);

create table events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete restrict,
  series_id uuid references event_series (id) on delete set null,
  name text not null,
  starts_at timestamptz,
  location text,
  status event_status not null default 'active',
  completed_at timestamptz,
  staff_can_start_conversations boolean not null default false,
  created_at timestamptz not null default now(),
  constraint events_completed_at_matches_status
    check ((status = 'completed') = (completed_at is not null))
);
create index events_client_idx on events (client_id);
create index events_series_idx on events (series_id);

create table roster_entries (
  event_id uuid not null references events (id) on delete cascade,
  event_staff_id uuid not null references event_staff (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (event_id, event_staff_id)
);
create index roster_entries_staff_idx on roster_entries (event_staff_id);

create table event_attendance (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  source attendance_source not null default 'manual',
  created_at timestamptz not null default now(),
  unique (event_id, contact_id)
);
create index event_attendance_contact_idx on event_attendance (contact_id);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  parent_assignment_id uuid references assignments (id) on delete cascade,
  title text not null,
  description text,
  status assignment_status not null default 'ready',
  tags text[] not null default '{}',
  due_date date,
  priority assignment_priority not null default 'medium',
  pickup_setting pickup_setting not null default 'admin_only',
  created_at timestamptz not null default now()
);
create index assignments_event_idx on assignments (event_id);
create index assignments_parent_idx on assignments (parent_assignment_id);

create table assignment_assignees (
  assignment_id uuid not null references assignments (id) on delete cascade,
  event_staff_id uuid not null references event_staff (id) on delete cascade,
  assigned_via assigned_via not null default 'admin',
  assigned_at timestamptz not null default now(),
  primary key (assignment_id, event_staff_id)
);
create index assignment_assignees_staff_idx on assignment_assignees (event_staff_id);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  created_by_admin_id uuid references admins (id),
  created_by_event_staff_id uuid references event_staff (id),
  created_at timestamptz not null default now(),
  constraint conversations_single_creator check (
    (created_by_admin_id is not null)::int + (created_by_event_staff_id is not null)::int = 1
  )
);
create index conversations_event_idx on conversations (event_id);

create table conversation_participants (
  conversation_id uuid not null references conversations (id) on delete cascade,
  event_staff_id uuid not null references event_staff (id) on delete cascade,
  primary key (conversation_id, event_staff_id)
);
create index conversation_participants_staff_idx on conversation_participants (event_staff_id);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_admin_id uuid references admins (id),
  sender_event_staff_id uuid references event_staff (id),
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_single_sender check (
    (sender_admin_id is not null)::int + (sender_event_staff_id is not null)::int = 1
  )
);
create index messages_conversation_idx on messages (conversation_id, created_at);

create table email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  body_html text not null,
  source email_template_source not null default 'manual',
  created_at timestamptz not null default now()
);

create table form_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table form_fields (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references form_templates (id) on delete cascade,
  position int not null,
  label text not null,
  description text,
  field_type form_field_type not null,
  required boolean not null default false,
  styling jsonb not null default '{}'
);
create index form_fields_template_idx on form_fields (form_template_id, position);

create table form_attachments (
  id uuid primary key default gen_random_uuid(),
  form_template_id uuid not null references form_templates (id) on delete cascade,
  target_type form_attachment_target not null,
  target_id uuid not null,
  staff_visible boolean not null default false,
  created_at timestamptz not null default now(),
  unique (form_template_id, target_type, target_id)
);
create index form_attachments_target_idx on form_attachments (target_type, target_id);

create table email_sends (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  body_html text not null,
  form_attachment_id uuid references form_attachments (id) on delete set null,
  sent_at timestamptz not null default now()
);

create table email_recipients (
  email_send_id uuid not null references email_sends (id) on delete cascade,
  contact_id uuid not null references contacts (id) on delete cascade,
  primary key (email_send_id, contact_id)
);
create index email_recipients_contact_idx on email_recipients (contact_id);

create table submissions (
  id uuid primary key default gen_random_uuid(),
  form_attachment_id uuid not null references form_attachments (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  submitted_at timestamptz not null default now()
);
create index submissions_attachment_idx on submissions (form_attachment_id);

create table submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions (id) on delete cascade,
  form_field_id uuid not null references form_fields (id) on delete cascade,
  value text,
  file_ref text
);
create index submission_answers_submission_idx on submission_answers (submission_id);

-- ============================================================================
-- Auth helper functions
--
-- SECURITY DEFINER so they can read admins/event_staff/roster_entries
-- regardless of the caller's own RLS grants (avoids recursive-policy
-- problems and keeps every other policy below a one-line call).
-- ============================================================================

create function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from admins where auth_user_id = auth.uid());
$$;

create function current_event_staff_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from event_staff where auth_user_id = auth.uid();
$$;

create function is_on_roster(target_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from roster_entries
    where event_id = target_event_id
      and event_staff_id = current_event_staff_id()
  );
$$;

create function is_on_roster_for_assignment(target_assignment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_on_roster(event_id) from assignments where id = target_assignment_id;
$$;

create function shares_roster_with(other_staff_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from roster_entries mine
    join roster_entries theirs on theirs.event_id = mine.event_id
    where mine.event_staff_id = current_event_staff_id()
      and theirs.event_staff_id = other_staff_id
  );
$$;

create function is_conversation_participant(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from conversation_participants
    where conversation_id = target_conversation_id
      and event_staff_id = current_event_staff_id()
  );
$$;

-- A staff-visible form attachment the current staff member is entitled to
-- see: either its event is on their roster, or its assignment's event is.
create function can_staff_view_form_attachment(target_attachment_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select fa.staff_visible
    and (
      (fa.target_type = 'event' and is_on_roster(fa.target_id))
      or (fa.target_type = 'assignment' and is_on_roster_for_assignment(fa.target_id))
    )
  from form_attachments fa
  where fa.id = target_attachment_id;
$$;

-- ============================================================================
-- Row Level Security
--
-- Everything defaults closed. Admin gets full access everywhere via a
-- single `is_admin()` policy per table. Public/anonymous form-fill traffic
-- is deliberately NOT granted any policy here: submissions are written by a
-- trusted server route using the service role key (bypasses RLS), which
-- validates the target attachment before writing anything. See
-- docs/adr/0006-per-attachment-form-visibility.md for why visibility is
-- per-attachment rather than a table-wide flag.
-- ============================================================================

alter table contacts enable row level security;
alter table categories enable row level security;
alter table contact_categories enable row level security;
alter table clients enable row level security;
alter table event_staff enable row level security;
alter table admins enable row level security;
alter table event_series enable row level security;
alter table events enable row level security;
alter table roster_entries enable row level security;
alter table event_attendance enable row level security;
alter table assignments enable row level security;
alter table assignment_assignees enable row level security;
alter table conversations enable row level security;
alter table conversation_participants enable row level security;
alter table messages enable row level security;
alter table email_templates enable row level security;
alter table form_templates enable row level security;
alter table form_fields enable row level security;
alter table form_attachments enable row level security;
alter table email_sends enable row level security;
alter table email_recipients enable row level security;
alter table submissions enable row level security;
alter table submission_answers enable row level security;

-- Admin: full access to every table.
create policy admin_all on contacts for all using (is_admin()) with check (is_admin());
create policy admin_all on categories for all using (is_admin()) with check (is_admin());
create policy admin_all on contact_categories for all using (is_admin()) with check (is_admin());
create policy admin_all on clients for all using (is_admin()) with check (is_admin());
create policy admin_all on event_staff for all using (is_admin()) with check (is_admin());
create policy admin_all on admins for all using (is_admin()) with check (is_admin());
create policy admin_all on event_series for all using (is_admin()) with check (is_admin());
create policy admin_all on events for all using (is_admin()) with check (is_admin());
create policy admin_all on roster_entries for all using (is_admin()) with check (is_admin());
create policy admin_all on event_attendance for all using (is_admin()) with check (is_admin());
create policy admin_all on assignments for all using (is_admin()) with check (is_admin());
create policy admin_all on assignment_assignees for all using (is_admin()) with check (is_admin());
create policy admin_all on conversations for all using (is_admin()) with check (is_admin());
create policy admin_all on conversation_participants for all using (is_admin()) with check (is_admin());
create policy admin_all on messages for all using (is_admin()) with check (is_admin());
create policy admin_all on email_templates for all using (is_admin()) with check (is_admin());
create policy admin_all on form_templates for all using (is_admin()) with check (is_admin());
create policy admin_all on form_fields for all using (is_admin()) with check (is_admin());
create policy admin_all on form_attachments for all using (is_admin()) with check (is_admin());
create policy admin_all on email_sends for all using (is_admin()) with check (is_admin());
create policy admin_all on email_recipients for all using (is_admin()) with check (is_admin());
create policy admin_all on submissions for all using (is_admin()) with check (is_admin());
create policy admin_all on submission_answers for all using (is_admin()) with check (is_admin());

-- Event Staff: read-only, scoped to what their roster memberships entitle
-- them to. All staff mutations go through the RPC functions below, which
-- enforce the narrower "status + pickup only" edit rule from
-- docs/adr — plain UPDATE/INSERT policies are deliberately not granted.

create policy staff_select_own on event_staff for select
  using (auth_user_id = auth.uid() or shares_roster_with(id));

create policy staff_select_own_contact on contacts for select
  using (
    id = (select contact_id from event_staff where auth_user_id = auth.uid())
    or id in (
      select es.contact_id from event_staff es where shares_roster_with(es.id)
    )
  );

create policy staff_select_rostered_events on events for select
  using (is_on_roster(id));

create policy staff_select_event_clients on clients for select
  using (id in (select client_id from events where is_on_roster(id)));

create policy staff_select_own_roster on roster_entries for select
  using (is_on_roster(event_id));

create policy staff_select_rostered_assignments on assignments for select
  using (is_on_roster(event_id));

create policy staff_select_assignees on assignment_assignees for select
  using (is_on_roster_for_assignment(assignment_id));

create policy staff_select_own_conversations on conversations for select
  using (is_conversation_participant(id));

create policy staff_insert_conversations on conversations for insert
  with check (
    created_by_event_staff_id = current_event_staff_id()
    and is_on_roster(event_id)
    and (select staff_can_start_conversations from events where id = event_id)
  );

create policy staff_select_own_participants on conversation_participants for select
  using (is_conversation_participant(conversation_id));

create policy staff_select_own_messages on messages for select
  using (is_conversation_participant(conversation_id));

create policy staff_insert_messages on messages for insert
  with check (
    sender_event_staff_id = current_event_staff_id()
    and is_conversation_participant(conversation_id)
  );

create policy staff_select_visible_form_templates on form_templates for select
  using (
    id in (
      select form_template_id from form_attachments
      where can_staff_view_form_attachment(id)
    )
  );

create policy staff_select_visible_form_fields on form_fields for select
  using (
    form_template_id in (
      select form_template_id from form_attachments
      where can_staff_view_form_attachment(id)
    )
  );

create policy staff_select_visible_form_attachments on form_attachments for select
  using (can_staff_view_form_attachment(id));

create policy staff_select_visible_submissions on submissions for select
  using (can_staff_view_form_attachment(form_attachment_id));

create policy staff_select_visible_submission_answers on submission_answers for select
  using (
    submission_id in (
      select id from submissions where can_staff_view_form_attachment(form_attachment_id)
    )
  );

-- ============================================================================
-- RPCs for the narrow mutations staff are allowed to make. Each checks
-- roster membership and (for pickup) the assignment's pickup_setting itself
-- rather than relying on a table-level RLS policy, since "can change status
-- but not content" isn't expressible as a row filter.
-- ============================================================================

create function set_assignment_status(target_assignment_id uuid, new_status assignment_status)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not (is_admin() or is_on_roster_for_assignment(target_assignment_id)) then
    raise exception 'not authorized to update this assignment';
  end if;

  update assignments set status = new_status where id = target_assignment_id;
end;
$$;

create function pickup_assignment(target_assignment_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  staff_id uuid := current_event_staff_id();
  target_setting pickup_setting;
begin
  if staff_id is null then
    raise exception 'not authorized: no event staff record for this session';
  end if;

  if not is_on_roster_for_assignment(target_assignment_id) then
    raise exception 'not authorized: not on this assignment''s event roster';
  end if;

  select pickup_setting into target_setting from assignments where id = target_assignment_id;

  if target_setting is distinct from 'open_pickup' then
    raise exception 'this assignment is not open for pickup';
  end if;

  insert into assignment_assignees (assignment_id, event_staff_id, assigned_via)
  values (target_assignment_id, staff_id, 'pickup')
  on conflict (assignment_id, event_staff_id) do nothing;
end;
$$;

-- ============================================================================
-- Table/function privileges.
--
-- Newer Supabase projects no longer auto-grant anon/authenticated/
-- service_role access to tables created in migrations (see the
-- auto_expose_new_tables note in supabase/config.toml) — RLS policies above
-- only take effect once the underlying grant exists. `anon` deliberately
-- gets nothing: public form-fill traffic is written by a trusted server
-- route using the service_role key, never directly by the browser.
-- ============================================================================

grant usage on schema public to service_role, authenticated;

grant all on all tables in schema public to service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

grant execute on all functions in schema public to service_role, authenticated;
alter default privileges in schema public
  grant execute on functions to service_role, authenticated;
