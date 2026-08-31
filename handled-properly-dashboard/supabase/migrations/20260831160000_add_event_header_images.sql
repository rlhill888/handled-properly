-- Header image for an Event, shown to both admin and staff on the event's
-- detail page. Mirrors the form-submissions bucket pattern exactly: a
-- private bucket, upload/signed-URL read exclusively via the service-role
-- client (src/lib/supabase/admin.ts), never a public bucket URL. Only the
-- storage path is stored on the row — admin/staff read access goes through
-- a signed URL minted server-side on every page load (see
-- src/lib/data/event-header-image.ts). Write access is admin-only,
-- enforced in the Server Action (setEventHeaderImage/removeEventHeaderImage
-- in event-tracker/actions.ts) the same way every other event mutation in
-- that file already is — not by a storage.objects RLS policy, since (like
-- form-submissions) all storage access here goes through the admin client
-- and never a per-session client.
alter table events add column header_image_path text;

insert into storage.buckets (id, name, public)
values ('event-header-images', 'event-header-images', false)
on conflict (id) do nothing;
