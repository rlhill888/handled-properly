-- Removes the Event Series (recurrence) feature entirely. Recurring events
-- were grouped under a parent event_series row via events.series_id; the
-- admin can no longer create or view that grouping, so both the column and
-- the table go. Dropping the column first removes its FK constraint and
-- index implicitly; the table drop then removes its own index and RLS
-- policy the same way.
alter table events drop column series_id;

drop table event_series;
