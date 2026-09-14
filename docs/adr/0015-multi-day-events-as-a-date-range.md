---
status: accepted
---

# A multi-day Event is one row with a date range, not several linked occurrences

An Event can now span several consecutive days (e.g. a 3-day conference), via an optional `ends_at` alongside `starts_at`. The obvious alternative, given [`0003-event-series-as-independent-occurrences`](./0003-event-series-as-independent-occurrences.md) already models recurrence as separate Event rows linked by a Series, would be to treat each day of a multi-day event the same way: one Event row per day.

We rejected that here because a multi-day span isn't recurrence — it's one continuous occurrence. It has exactly one Roster, one set of Assignments, and one Conversation thread for its whole duration, and it's marked Completed once, as a whole. Splitting it into daily rows would scatter that single occurrence's state across several records with no natural way to keep them in sync, which is the same problem 0003 avoids for Series by keeping each occurrence independent — recurring meetings genuinely are separate occurrences with their own state, while the days of one conference are not.

So: a contiguous multi-day event is a single Event row carrying a `starts_at`/`ends_at` range, as opposed to the independent-occurrences model 0003 describes for genuinely repeating work.

> **Note**: 0003's Event Series grouping (referenced above for contrast) has since been removed — see 0003's superseded notice. Recurring events are now just separate, unlinked Event rows; this ADR's reasoning for why a multi-day span stays a single row is unaffected.
