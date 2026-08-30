---
status: accepted
---

# A Form is created once and is never shared across multiple targets

Forms used to be modeled as a reusable Form Template plus a separate Form Attachment joining that template to an Event, Assignment, or Email Send — so the same field layout could be attached to many targets at once, each with its own visibility setting and submissions (see [`0006-per-attachment-form-visibility`](./0006-per-attachment-form-visibility.md), now superseded). That split also meant a Form Template with no attachment had no fill-link at all — there was no way to hand someone a form to fill out until it had been attached somewhere.

We collapsed the two into a single Form: a Form is created once, has exactly one fill-link and one bucket of submissions, and is optionally scoped to a single Event, Assignment, or Email Send (`target_type`/`target_id`, both nullable — null means standalone). It is never shared across multiple targets. Reuse now means creating another Form — if that turns out to be painful in practice (e.g. the same waiver needed on every Event), the fix is a "duplicate this Form" convenience that copies fields into a new Form, not resurrecting the template/attachment split.

A reader used to the old model would expect an "attach a Form" step distinct from "create a Form" — it no longer exists. Creating a Form and placing it somewhere are now the same action.
