-- Lets an Event span a date range (e.g. a multi-day conference) instead of
-- only a single start instant. ends_at mirrors starts_at's shape exactly
-- (nullable timestamptz, same optionality) so every existing event with no
-- end date continues to render exactly as it does today. The check
-- constraint follows the same null-safe boolean-expression style as
-- events_completed_at_matches_status: it's only enforced when both dates
-- are present, so a start-only or fully-dateless event is unaffected.
alter table events add column ends_at timestamptz;

alter table events add constraint events_ends_at_after_starts_at
  check (ends_at is null or starts_at is null or ends_at >= starts_at);
