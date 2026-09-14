-- Removes the Assignment Priority feature entirely (the Low/Medium/High tag
-- on an individual Assignment) — mirrors 20260901220000_drop_assignment_tags.sql.
alter table assignments drop column priority;
drop type assignment_priority;
