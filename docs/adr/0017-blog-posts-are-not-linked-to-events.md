---
status: accepted
---

# Blog Posts are a standalone table, not linked to Events

The public `/events` page and the homepage's featured grid needed admin-authored write-ups of past events — title, a cover image, a short body, whether it's featured. The obvious shape would have been to hang this content off the existing `events` table (the internal staffing record: client, roster, assignments, status), e.g. an `events.public_writeup` column or a `blog_post_id` FK on `events`.

We didn't do that. `site_blog_posts` is a fully standalone table with no reference to `events` at all. Two reasons:

- **Different audiences, different lifecycles.** `events` is staff/client-facing operational data (roster, assignments, conversations) locked read-only once Completed. A Blog Post is public marketing copy the admin writes and edits independently — often well after the event, sometimes for an event that predates this system entirely, sometimes never for an event that *is* tracked here. Coupling them would mean either every Event needs a Blog Post (it doesn't) or every Blog Post needs a matching Event row (it doesn't).
- **Avoiding the name collision.** "Event" is reserved in this codebase for the internal staffing occurrence (see `CONTEXT.md`). Naming the public content type anything that reads as "the Event's blog post" invites confusion between an operational record with a Roster and a piece of public marketing copy. Calling it **Blog Post** and keeping it unlinked keeps the two concepts — and their access rules (`is_admin()`-only vs. public reads via the service-role client) — cleanly separate.

A reader who wants "link a Blog Post to the Event it's about, so the write-up can pull real dates/roster info automatically" should treat that as a new requirement informed by an actual need, not evidence this should have been a column on `events`.
