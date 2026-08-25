-- Private storage bucket for file-type Submission answers. Uploaded and
-- read exclusively via the service-role client (public form-fill has no
-- anon grants, same as every other write in this feature — see the RLS
-- comment in the initial schema migration); admin/staff read access goes
-- through short-lived signed URLs generated server-side, never a public
-- bucket URL.
insert into storage.buckets (id, name, public)
values ('form-submissions', 'form-submissions', false)
on conflict (id) do nothing;
