---
status: accepted
---

# A Form can be attached to many Email Sends, unlike Event/Assignment scoping

[`0008-forms-are-not-reusable-templates`](./0008-forms-are-not-reusable-templates.md) established that a Form is never shared across multiple targets — reuse means creating another Form. In practice this made Email Sends worse than Events/Assignments: the same registration or feedback Form the admin already built and scoped to an Event couldn't also be emailed out, and a Form couldn't be sent in more than one Email Send without duplicating it field-for-field.

Event and Assignment scoping don't have this problem — a Form genuinely belongs to one Event or one Assignment, matching how Rosters and Assignments work elsewhere in the domain. Email Sends are different: they're transient dispatches, not owners of state, and "send this same form again" or "attach an existing form to a new blast" are ordinary, frequent admin actions, not edge cases.

So the Email Send relationship moves out of `forms.target_type`/`target_id` into its own many-to-many join table (`email_send_forms`), while `target_type`/`target_id` keeps doing exactly what it did before for `'event'` and `'assignment'`. A Form's Event/Assignment scope is still singular and exclusive, unchanged from 0008. Only its relationship to Email Sends is now many-to-many: any number of Forms can be attached to one Email Send, and the same Form can be attached to any number of Email Sends, independently of whatever Event/Assignment it's scoped to (or not).

A reader familiar with 0008 would expect "never shared across multiple targets" to apply uniformly to Email Sends too — it no longer does, and that's deliberate, not an oversight.
