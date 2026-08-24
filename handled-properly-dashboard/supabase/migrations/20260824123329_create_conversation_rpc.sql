-- Creating a Conversation via plain INSERT has two problems for a staff
-- caller: (1) `.insert().select()` needs to read the row back, but
-- staff_select_own_conversations requires the caller to already be a
-- participant — which they aren't yet at insert time, so the read-back
-- (and therefore the whole request) fails; (2) there's no staff INSERT
-- policy on conversation_participants at all (deliberately narrow — see
-- the RLS comment in the initial migration). Same shape of problem as
-- pickup_assignment/set_assignment_status: wrap it in a SECURITY DEFINER
-- RPC that does the authorization check itself and inserts both rows in
-- one transaction, always including the staff creator as a participant.
create function create_conversation(
  target_event_id uuid,
  participant_event_staff_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_conversation_id uuid;
  caller_admin_id uuid := (select id from admins where auth_user_id = auth.uid());
  caller_staff_id uuid := current_event_staff_id();
  allow_staff_start boolean;
begin
  if caller_admin_id is null and caller_staff_id is null then
    raise exception 'not authorized';
  end if;

  if caller_staff_id is not null then
    if not is_on_roster(target_event_id) then
      raise exception 'not authorized: not on this event''s roster';
    end if;

    select staff_can_start_conversations into allow_staff_start
    from events where id = target_event_id;

    if not allow_staff_start then
      raise exception 'this event does not allow staff to start conversations';
    end if;
  end if;

  insert into conversations (event_id, created_by_admin_id, created_by_event_staff_id)
  values (target_event_id, caller_admin_id, caller_staff_id)
  returning id into new_conversation_id;

  insert into conversation_participants (conversation_id, event_staff_id)
  select new_conversation_id, staff_id
  from unnest(participant_event_staff_ids) as staff_id
  union
  select new_conversation_id, caller_staff_id
  where caller_staff_id is not null
  on conflict do nothing;

  return new_conversation_id;
end;
$$;

revoke execute on function create_conversation(uuid, uuid[]) from public, anon;
grant execute on function create_conversation(uuid, uuid[]) to authenticated;
