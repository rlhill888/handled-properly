-- Postgres grants EXECUTE on new functions to PUBLIC by default (unlike
-- tables) — revoke that. Superseded in the next migration once it turned
-- out `anon` also held its own explicit grant that this alone doesn't
-- touch; kept as its own migration to mirror what was actually applied.
revoke execute on all functions in schema public from public;
alter default privileges in schema public
  revoke execute on functions from public;

grant execute on all functions in schema public to service_role, authenticated;
alter default privileges in schema public
  grant execute on functions to service_role, authenticated;
