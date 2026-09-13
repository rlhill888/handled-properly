-- Removes the Roster Category feature entirely (per-event labels like
-- "Security"/"Bar Staff" used to group an Event's Roster members). The
-- global Contact Category (categories/contact_categories) is a separate,
-- unrelated concept and is untouched by this migration — see
-- 0007-roster-category-is-per-event.md (now superseded) for the original
-- reasoning that kept them apart in the first place.
drop table roster_entry_categories;
drop table roster_categories;
