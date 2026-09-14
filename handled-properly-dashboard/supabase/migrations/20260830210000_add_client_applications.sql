-- Client Application: a prospective client's request to hire Handled
-- Properly, submitted through the public "/get-started" intake page before
-- any Client record exists (see docs/adr/0011-client-applications-are-not-forms.md
-- for why this is its own table rather than a standalone Form). The public
-- page calls this an "inquiry"; the admin reviews it as an "Application" and
-- can convert it into a Client.
create type client_application_status as enum ('pending', 'converted', 'declined');

create table client_applications (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts (id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  company_name text,
  event_date date,
  guest_count int,
  location text,
  budget text,
  message text not null,
  status client_application_status not null default 'pending',
  ai_summary text,
  submitted_at timestamptz not null default now()
);
create index client_applications_status_idx on client_applications (status, submitted_at desc);

alter table client_applications enable row level security;

-- Same shape as every other admin-owned table: a single is_admin() policy.
-- The public intake page is written by a trusted server route using the
-- service_role key (see the grants comment in the initial schema migration)
-- so, like submissions, anon gets no direct policy here.
create policy admin_all on client_applications for all using (is_admin()) with check (is_admin());
