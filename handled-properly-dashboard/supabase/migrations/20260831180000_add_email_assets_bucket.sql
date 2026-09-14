-- Images that come along with an uploaded Canva HTML export (referenced by
-- the exported HTML via local relative paths like "images/photo1.png",
-- which obviously can't resolve once the HTML is emailed out). Unlike
-- every other bucket in this schema (form-submissions, event-header-images
-- — both private, read only via a short-lived signed URL minted
-- server-side), this one is PUBLIC: a recipient's email client has no
-- Supabase session to authenticate a signed URL with, and the image needs
-- to keep working indefinitely, not for a few minutes/hours.
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do nothing;
