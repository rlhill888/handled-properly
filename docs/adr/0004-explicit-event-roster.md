---
status: accepted
---

# Event Roster is explicit and independent of Assignment assignees

We considered deriving "which staff are part of this event" implicitly — a staff member counts as part of an Event only if they're assigned to at least one of its Assignments. We rejected that: it means a staff member can't be added to an Event (and therefore can't see it, be added to its Conversations, or be eligible to pick up open Assignments) until an Assignment happens to name them, which inverts the natural workflow of "admin staffs the event, then work gets assigned."

Instead, the Roster is its own many-to-many relationship between Event and Event Staff, set directly by the admin. Assignment assignees are drawn from the Roster but are a separate, narrower relationship — being on the Roster doesn't imply being assigned to any particular Assignment, and vice versa isn't possible (an Assignment can only be given to Roster members). This is the permission backbone for Event and Conversation visibility, so getting the direction of derivation right here was worth deciding deliberately rather than discovering it under a permissions bug later.
