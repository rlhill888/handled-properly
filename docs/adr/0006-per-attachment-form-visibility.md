---
status: accepted
---

# Form staff-visibility is set per Form Attachment, not per Form Template

A Form Template is meant to be reused — the same "Client Intake" template might be attached to many different Events over time. If staff-visibility of results were a property of the Template itself, reusing a template would force the same visibility choice everywhere it's attached, which contradicts the requirement that the admin decide per-event/per-assignment whether staff can see that particular form's results.

So visibility lives on the Form Attachment (the join between a Template and an Event, Assignment, or Email Send), not on the Template. The same Template can be staff-visible on one Event and admin-only on another. A reader who assumes "visibility" is a template setting (the more common pattern for form builders) would build this wrong, hence recording it here.
