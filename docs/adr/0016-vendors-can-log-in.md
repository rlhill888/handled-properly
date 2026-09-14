---
status: accepted
---

# Vendors can log in

Vendor was documented as explicitly login-less: a Contact is "a Vendor on Event X" purely by being on that Event's `event_vendors` list, with no fields or account of its own (see `20260901222405_drop_vendors_table.sql`, which removed an earlier `vendors` table for exactly that reason). The Vendor Portal reverses that: a Vendor needs to see, for one Event, when and where to arrive, an optional setup time/location and a photo of where to set up, and parking instructions — none of which fits on the bare `event_vendors` link — so `vendors` gains a real table again, with an auth shape mirroring `event_staff`/`clients` (`auth_user_id`, `invite_status`, `invited_at`, self-service activation via `activate_own_vendor_account`).

Two things make this more than a straight copy of [`0013-clients-can-log-in`](./0013-clients-can-log-in.md):

- **The per-event checklist is its own table, `vendor_event_details`**, not fields on `vendors` itself. A Vendor's identity (their login) is durable across Events, the same as a Client's, but their arrival time, setup instructions, and location photo are specific to one Event — a caterer working two Events this month has one login and two different arrival times.
- **Access can auto-expire.** The admin may flag a Vendor's access to a given Event (`vendor_event_details.access_expires_after_event`) to end once that Event is Completed or its `ends_at` has passed. This is computed live in `is_vendor_for_event()`, not by a scheduled job — consistent with how every other Event-status check in this app already works (nothing here runs on a timer).

A reader who finds `vendors.auth_user_id` and remembers Vendor as login-less: this ADR, and the table's own re-creation migration, are why that changed.
