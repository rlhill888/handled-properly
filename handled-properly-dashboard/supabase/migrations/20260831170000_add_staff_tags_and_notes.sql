-- Free-text notes on a staff member, admin-only — mirrors clients.notes.
-- ("Tags" on staff turned out to mean the roster_categories a staff member
-- has ever been assigned across events they've been on, not a new
-- independent tagging system — no schema needed for that, it's a query
-- over the existing roster_categories/roster_entry_categories tables.)
alter table event_staff add column notes text;
