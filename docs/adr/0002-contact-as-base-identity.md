---
status: accepted
---

# Contact is the base identity; roles attach to it, Attendee has no table of its own

Client, Event Staff, and Attendee all need to end up on the same mass-email contact list, and a single real person can hold more than one of these roles over time (an Attendee who later joins as Event Staff, a Client who's also tagged VIP). We considered making Contact a synced projection that mirrors Client/Staff records into a separate mailing-list table, but that requires ongoing sync logic and produces exactly the kind of duplicate-copy drift the "one source of truth per person" requirement was meant to avoid.

Instead, Contact is the one stored identity (name, email, phone) for a person. Client and Event Staff are role records that reference a Contact by foreign key and carry only their role-specific fields. Attendee isn't a table at all — a Contact is "an attendee of Event X" purely by virtue of having an Event Attendance row linking it to that Event. This means gaining or losing a role never touches identity data, and a person appears once in every filter/search regardless of how many roles they hold.
