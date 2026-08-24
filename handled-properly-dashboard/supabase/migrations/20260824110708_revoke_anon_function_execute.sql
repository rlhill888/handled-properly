-- `anon` turned out to hold its own explicit EXECUTE grant on every
-- function in this project (not just via PUBLIC — see the previous
-- migration), most likely from a platform-level default. Revoking from
-- PUBLIC alone left it in place; revoke it directly. Verified with:
--   select proname, proacl from pg_proc
--   join pg_namespace on pg_namespace.oid = pronamespace
--   where nspname = 'public';
-- anon disappeared from every function's ACL after this ran.
revoke execute on all functions in schema public from anon;
alter default privileges in schema public
  revoke execute on functions from anon;
