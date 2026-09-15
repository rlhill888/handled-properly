-- Lets a Client see the Staff roster on their own Event — same shape as
-- client_select_event_vendors/client_select_own_vendors in add_vendors.sql,
-- but for roster_entries/event_staff instead of event_vendors/vendors.
create policy client_select_own_roster on roster_entries for select
  using (is_client_for_event(event_id));

create policy client_select_roster_staff on event_staff for select
  using (
    id in (
      select event_staff_id from roster_entries where is_client_for_event(event_id)
    )
  );

-- A third, additive SELECT policy on contacts (Postgres OR's permissive
-- policies together — same pattern as client_select_vendor_contacts) so a
-- Client can read the Contact info (name/email) behind a rostered Staff
-- member on their Event.
create policy client_select_staff_contacts on contacts for select
  using (
    id in (
      select es.contact_id
      from event_staff es
      join roster_entries re on re.event_staff_id = es.id
      where is_client_for_event(re.event_id)
    )
  );
