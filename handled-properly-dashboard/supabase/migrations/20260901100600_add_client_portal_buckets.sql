-- Two new private buckets for the Client Portal, following the same
-- pattern as every other bucket in this project: no storage.objects RLS
-- policies — access is enforced entirely in Server Actions via
-- getCurrentActor(), using the service-role client for every storage call.
insert into storage.buckets (id, name, public)
values ('request-attachments', 'request-attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('documentation-files', 'documentation-files', false)
on conflict (id) do nothing;
