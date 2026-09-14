-- A Form stays scoped to at most one Event/Assignment (target_type/target_id,
-- unchanged), but can now be attached to any number of Email Sends
-- independently of that scope — a deliberate, narrow exception to
-- docs/adr/0008-forms-are-not-reusable-templates.md for the Email Send case
-- only. See docs/adr/0010-forms-can-email-send-multi-attach.md.

create table email_send_forms (
  email_send_id uuid not null references email_sends (id) on delete cascade,
  form_id uuid not null references forms (id) on delete cascade,
  primary key (email_send_id, form_id)
);
create index email_send_forms_form_idx on email_send_forms (form_id);

-- Backfill existing single-target email_send scoping into the join table.
insert into email_send_forms (email_send_id, form_id)
select target_id, id from forms where target_type = 'email_send'
on conflict do nothing;

-- Defensive: email_sends.form_id should already mirror the above, but
-- backfill from it too in case of any drift before it's dropped.
insert into email_send_forms (email_send_id, form_id)
select id, form_id from email_sends where form_id is not null
on conflict do nothing;

update forms set target_type = null, target_id = null where target_type = 'email_send';

alter table email_sends drop column if exists form_id;

alter table email_send_forms enable row level security;
create policy admin_all on email_send_forms for all using (is_admin()) with check (is_admin());
