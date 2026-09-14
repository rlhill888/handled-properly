-- Private bucket for the admin-uploaded photo showing a Vendor where to set
-- up. Same convention as every other bucket in this app: private, no
-- storage.objects RLS — access goes through the service-role admin client
-- only, gated by getCurrentActor() checks in server actions.
insert into storage.buckets (id, name, public)
values ('vendor-location-photos', 'vendor-location-photos', false)
on conflict (id) do nothing;
