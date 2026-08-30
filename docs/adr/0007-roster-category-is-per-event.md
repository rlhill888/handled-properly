---
status: accepted
---

# Roster Category is scoped per-Event, not the global Contact Category

The admin wanted to group an Event's Roster into working categories — "Security", "Bar Staff" — and assign Roster members to them. We considered reusing the existing Category concept (the admin-managed, reusable Contact taxonomy already used for mass-email filtering), since Event Staff are Contacts and already carry Categories. We rejected that: the same staff member plays different roles on different Events — someone is "Security" tonight and "Bar Staff" next weekend — so a global, cross-Event Category would either force one fixed label per person regardless of which Event it's for, or flood the admin-wide Category list with one-off labels that only ever make sense on a single Event, defeating the point of Category being a reusable, cross-Event taxonomy for mass email.

Instead, Roster Category is its own concept: a label created by the admin scoped to a single Event (`roster_categories.event_id`), assigned to that Event's Roster members via a separate join (`roster_entry_categories`). Creating a Roster Category on one Event never affects, and is never visible on, any other Event's Roster — there is no shared or reusable list across Events, unlike Category. It is also distinct from Tag (free-text, per-Assignment, no reuse enforcement at all) — Roster Category has a defined list per Event and is assigned via toggle, not typed freely. A reader who assumes Roster Category is just Category applied to Event Staff, or the same mechanism as Assignment Tags, would build this wrong, hence recording it here.
