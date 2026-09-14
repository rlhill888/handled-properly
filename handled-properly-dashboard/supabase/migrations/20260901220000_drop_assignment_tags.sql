-- Removes the Assignment Tag feature entirely (free-text labels typed onto
-- an individual Assignment, e.g. "setup", "front-of-house" — no central
-- list or reuse enforcement, distinct from the global Contact Category).
alter table assignments drop column tags;
