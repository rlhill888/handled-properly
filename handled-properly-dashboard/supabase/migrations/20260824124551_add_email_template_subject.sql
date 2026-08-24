-- The domain model gave email_templates only a body — the actual ticket
-- (#14) needs both subject and body saved and restored together, so a
-- "start from a template" flow doesn't leave the subject blank.
alter table email_templates add column subject text not null default '';
