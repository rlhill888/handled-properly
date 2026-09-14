-- prevent_nested_subtasks() is a trigger function only — it's invoked by
-- Postgres's trigger machinery (which doesn't require an EXECUTE grant to
-- the triggering role), never meant to be called directly as an RPC. The
-- initial schema's revoke_public_function_execute/revoke_anon_function_execute
-- migrations only covered functions that existed at the time; this closes
-- the same gap for this one, added afterward.
revoke execute on function prevent_nested_subtasks() from public;
revoke execute on function prevent_nested_subtasks() from anon;
revoke execute on function prevent_nested_subtasks() from authenticated;
