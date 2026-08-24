---
status: accepted
---

# Recurring events are independent Event rows linked to a Series, not one record with a recurrence rule

The obvious way to model "recurring event" is a single Event row plus a recurrence rule (RRULE-style), the way a calendar app would. We rejected that because every other requirement in this domain is scoped per-occurrence: each occurrence needs its own Roster, its own Assignments, its own Conversations, and its own place in the history archive once it's independently marked Completed. A single row with a recurrence rule can't carry per-occurrence state without becoming a rule-plus-exceptions system.

Instead, an Event Series is just a parent record, and each occurrence is a fully independent Event row linked to it. The admin creates occurrences one at a time rather than generating a whole schedule up front — this was a deliberate scope cut (less to build now), not a modeling constraint, so bulk generation can be added later without changing the underlying shape.
