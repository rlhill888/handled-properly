-- Collapse Form Template + Form Attachment into a single Form (see
-- docs/adr/0008-forms-are-not-reusable-templates.md, which supersedes
-- docs/adr/0006-per-attachment-form-visibility.md). A Form is created once,
-- optionally scoped to one Event/Assignment/Email Send (target_type/
-- target_id null means standalone/unassigned), and is never shared across
-- multiple targets — reuse means creating another Form. No rows exist yet
-- in any of these tables, so this is a straight drop-and-recreate rather
-- than a backfill migration.

drop policy if exists staff_select_visible_submission_answers on submission_answers;
drop policy if exists staff_select_visible_submissions on submissions;
drop policy if exists staff_select_visible_form_attachments on form_attachments;
drop policy if exists staff_select_visible_form_fields on form_fields;
drop policy if exists staff_select_visible_form_templates on form_templates;
drop policy if exists admin_all on submission_answers;
drop policy if exists admin_all on submissions;
drop policy if exists admin_all on form_attachments;
drop policy if exists admin_all on form_fields;
drop policy if exists admin_all on form_templates;

alter table email_sends drop column if exists form_attachment_id;

drop table if exists submission_answers;
drop table if exists submissions;
drop table if exists form_attachments;
drop table if exists form_fields;
drop table if exists form_templates;

drop function if exists can_staff_view_form_attachment(uuid);

alter type form_attachment_target rename to form_target_type;

create table forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  theme jsonb not null default '{}',
  target_type form_target_type,
  target_id uuid,
  staff_visible boolean not null default false,
  created_at timestamptz not null default now()
);
create index forms_target_idx on forms (target_type, target_id);

create table form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms (id) on delete cascade,
  position int not null,
  label text not null,
  description text,
  field_type form_field_type not null,
  required boolean not null default false,
  styling jsonb not null default '{}'
);
create index form_fields_form_idx on form_fields (form_id, position);

alter table email_sends add column form_id uuid references forms (id) on delete set null;

create table submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references forms (id) on delete cascade,
  contact_id uuid references contacts (id) on delete set null,
  submitted_at timestamptz not null default now()
);
create index submissions_form_idx on submissions (form_id);

create table submission_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions (id) on delete cascade,
  form_field_id uuid not null references form_fields (id) on delete cascade,
  value text,
  file_ref text
);
create index submission_answers_submission_idx on submission_answers (submission_id);

-- A staff-visible Form the current staff member is entitled to see: either
-- its Event is on their roster, or its Assignment's Event is. A standalone
-- Form (target_type is null) never matches either branch.
create function can_staff_view_form(target_form_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select f.staff_visible
    and (
      (f.target_type = 'event' and is_on_roster(f.target_id))
      or (f.target_type = 'assignment' and is_on_roster_for_assignment(f.target_id))
    )
  from forms f
  where f.id = target_form_id;
$$;

alter table forms enable row level security;
alter table form_fields enable row level security;
alter table submissions enable row level security;
alter table submission_answers enable row level security;

create policy admin_all on forms for all using (is_admin()) with check (is_admin());
create policy admin_all on form_fields for all using (is_admin()) with check (is_admin());
create policy admin_all on submissions for all using (is_admin()) with check (is_admin());
create policy admin_all on submission_answers for all using (is_admin()) with check (is_admin());

create policy staff_select_visible_forms on forms for select
  using (can_staff_view_form(id));

create policy staff_select_visible_form_fields on form_fields for select
  using (
    form_id in (
      select id from forms where can_staff_view_form(id)
    )
  );

create policy staff_select_visible_submissions on submissions for select
  using (can_staff_view_form(form_id));

create policy staff_select_visible_submission_answers on submission_answers for select
  using (
    submission_id in (
      select id from submissions where can_staff_view_form(form_id)
    )
  );
