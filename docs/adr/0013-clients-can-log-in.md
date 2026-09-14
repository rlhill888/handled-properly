---
status: accepted
---

# Clients can log in

Until now, Client has been explicitly documented as not logging in — Event Staff get portal accounts (admin invite, `auth.users`, set-password), Clients didn't. The Client Portal reverses that: a Client needs an authenticated account to see their Events, Event Tasks, Requests, vendor contacts, and Documentation, so `clients` gains an `auth_user_id` and an invite/activate flow mirroring `event_staff`'s (`invite_status`, `activate_own_staff_account`-style self-service activation).

This is a real trade-off, not a formality: the alternative was a lighter-weight, account-less scheme (e.g. a per-event magic link), which was rejected because the portal's own home screen — "a list of their active Events" — implies a durable identity across visits and across Events, not a one-off link per Event.

A reader who finds `clients.auth_user_id` and wonders why Client, previously documented as login-less, now has one: this is why.
