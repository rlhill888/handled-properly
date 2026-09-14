---
status: accepted
---

# Client Applications are their own table, not a standalone Form

The public "/get-started" intake page — where a prospective client tells Handled Properly about their event before they're a Client — could have been built as just another standalone Form (see [`0008-forms-are-not-reusable-templates`](./0008-forms-are-not-reusable-templates.md)): create one with `target_type` null, point the page at its fill-link, and let it collect Submissions like anything else.

We didn't do that. A Client Application is a fixed, opinionated question set (date, guest count, location, budget, a free-text description) that the admin never redesigns per-inquiry, and it carries its own lifecycle — pending, converted into a Client, or declined — plus a cached AI summary generated the first time the admin opens it. None of that fits the generic Form/Submission shape: Submissions have no status or workflow, their answers are opaque key/value rows keyed by `form_field_id` rather than typed columns, and "convert to Client" would have had to reach into `submission_answers` and guess which answer was the email. `client_applications` instead has real columns (`name`, `email`, `event_date`, `status`, `ai_summary`, ...), so the admin list, the AI summary prompt, and the convert-to-Client action can all just read them directly.

A reader who wants "let the admin customize the intake questions" should treat that as a new requirement, not evidence this should have been a Form — if the question set ever needs to vary, that's a reason to reconsider, informed by what actually needs to vary, not a reason to retrofit Forms into having statuses and typed answers today.
