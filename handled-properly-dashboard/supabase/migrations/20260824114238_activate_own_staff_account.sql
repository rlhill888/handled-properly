-- Staff have no UPDATE policy on event_staff (only SELECT) — deliberately,
-- since a blanket policy would let them touch contact_id/auth_user_id too.
-- Setting invite_status to 'active' after they finish account setup is the
-- one self-service mutation they need, so it gets the same narrow-RPC
-- treatment as set_assignment_status/pickup_assignment.
create function activate_own_staff_account()
returns void
language sql
security definer
set search_path = public
as $$
  update event_staff set invite_status = 'active' where auth_user_id = auth.uid();
$$;

revoke execute on function activate_own_staff_account() from public, anon;
grant execute on function activate_own_staff_account() to authenticated;
