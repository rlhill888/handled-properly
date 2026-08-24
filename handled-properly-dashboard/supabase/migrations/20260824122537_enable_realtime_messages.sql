-- Realtime delivery for Conversations (#11) — Postgres Changes on the
-- messages table respects existing RLS (staff_select_own_messages,
-- admin_all), so a subscriber only receives INSERTs for conversations
-- they're actually allowed to SELECT.
alter publication supabase_realtime add table messages;
