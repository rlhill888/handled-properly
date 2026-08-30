---
status: accepted
---

# Mass email has no saved, reusable Template — every send is composed fresh

Email Template used to be its own record: a saved HTML body (written manually or by an AI draft) the admin could recall later and edit into a new Email Send, with its own admin-managed list separate from the log of sends already made. We removed it — the admin decided templates aren't needed right now. With AI drafting available on demand (a prompt regenerates a full subject and body in seconds), maintaining a separate reusable-template list added upkeep that wasn't earning its keep against just describing the email again when the time comes.

This isn't a permanent rejection of the idea, just a "not needed yet" — if day-to-day sends turn out to repeat often enough that regenerating from scratch each time gets genuinely painful, the fix is to reintroduce a template concept then, informed by which sends actually got repeated. `email_templates`, its actions, and the save/reuse/delete UI were removed along with the decision — there is no admin-facing "Templates" list distinct from the Email Send log anymore. A reader asked to "let the admin reuse a past email" shouldn't resurrect Email Template; if a genuine need for that resurfaces, look at what repeats first rather than rebuilding the old shape by default.
