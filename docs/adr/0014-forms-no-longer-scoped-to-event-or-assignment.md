---
status: accepted
---

# A Form is no longer scoped to an Event or an Assignment

[`0008-forms-are-not-reusable-templates`](./0008-forms-are-not-reusable-templates.md) established that a Form is optionally scoped to a single Event, Assignment, or Email Send via `target_type`/`target_id`, singular and exclusive. [`0010-forms-can-email-send-multi-attach`](./0010-forms-can-email-send-multi-attach.md) split Email Send out into its own many-to-many join table but left Event/Assignment scoping working exactly as 0008 described.

We removed the Event and Assignment cases. There is no longer a "Forms" section on an Event's admin page or on an Assignment's card, and no way to create a new Form pre-scoped to either — `FormsPanel`, the one shared component behind both entry points, was deleted outright. A Form going forward is either standalone (with its own fill-link, shared however the admin likes) or attached to one or more Email Sends; it can no longer belong to an Event or an Assignment.

This is an application-layer removal, not a schema change: `target_type` is still the same nullable `form_target_type` enum (`'event' | 'assignment' | 'email_send'`), `email_send_forms` is untouched, and `can_staff_view_form()`'s `'event'`/`'assignment'` RLS branches are still in place. Nothing can create a new Event- or Assignment-scoped Form anymore, but if any already existed, that row keeps behaving exactly as 0008/0010 describe — its fill-link still works, and a rostered Staff member can still see it via the untouched RLS branch. The enum values and RLS branches are left in place specifically to avoid orphaning that legacy state, not because the capability is still offered.

A reader following 0008 and 0010 would expect to find a "scope this Form to an Event/Assignment" step somewhere in the product — it no longer exists. Standalone-plus-optional-Email-Send-attachment is the only way to place a Form now.
