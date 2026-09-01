# Handled Properly

An events-staffing portal: a single admin manages clients, events, event staff, task assignments, in-event messaging, mass email, and fillable forms.

## Language

### Identity & roles

**Contact**:
The base identity record for any real person the system knows about (name, email, phone). Every person — however they relate to the business — is exactly one Contact.
_Avoid_: Person, User (User is a Supabase Auth concept, not a domain term)

**Client**:
A role attached to a Contact: someone who hires Handled Properly to staff an Event. A Client can have many Events. Logs into the Client Portal via admin invite, mirroring the Event Staff invite/set-password flow — see [`0013-clients-can-log-in`](./docs/adr/0013-clients-can-log-in.md).
_Avoid_: Customer, Account

**Client Application**:
A prospective client's request to hire Handled Properly, submitted through the public "/get-started" intake page before any Client record exists. Captures contact details and a fixed set of event questions (date, guest count, location, budget, a free-text description), plus a cached AI-generated summary shown when the admin opens it. The admin reviews an Application and can convert it into a Client, or decline it. A dedicated table, not a standalone Form/Submission — see [`0011-client-applications-are-not-forms`](./docs/adr/0011-client-applications-are-not-forms.md).
_Avoid_: Inquiry (the public page and its confirmation copy call it an inquiry — that's the same record from the submitter's side, not a different concept), Lead, Submission (Submission is reserved for Form answers)

**Event Staff**:
A role attached to a Contact: someone the admin can add to an Event's Roster and assign work to. Logs in via admin invite. One flat permission level — no supervisor/lead tier.
_Avoid_: Staff member, Team member, Vendor, Employee

**Attendee**:
Not a stored role — a Contact is "an attendee of Event X" purely by having an Event Attendance record for that Event. A Contact can be an Attendee of many Events over time, and can simultaneously hold other roles (e.g. also be Event Staff).
_Avoid_: Guest, Registrant

**Admin**:
The single account with unrestricted access: manages Clients, Events, Event Staff, Assignments, mass email, and can read/post in every Conversation. Not a Contact role — the admin is an operator of the system, not a person the system tracks relationships with.

### Events

**Event**:
A single occurrence of work for a Client — one-time or one instance of a recurring series. Owns its own Roster, Assignments, Conversations, and (once Completed) its own history record.
_Avoid_: Job, Gig, Booking

**Event Series**:
The parent record linking multiple Event occurrences that recur for the same Client. Occurrences are created individually by the admin, not generated in bulk from a schedule.
_Avoid_: Recurring Event (ambiguous — could mean the series or one occurrence)

**Roster**:
The explicit set of Event Staff added to an Event by the admin. Roster membership — not Assignment assignment — determines who can see the Event, be added to its Conversations, and be assigned/pick up its Assignments.
_Avoid_: Team, Assigned staff

**Roster Category**:
An admin-created label scoped to a single Event, used to group that Event's Roster members (e.g. "Security", "Bar Staff"). A Roster member can carry several. Created and managed per Event — never shared or reused across Events, unlike Category.
_Avoid_: Category (reserved for the global Contact taxonomy — see below), Tag (reserved for Assignments — see below)

**Active** (Event status):
The literal, default `event_status` an Event holds from creation until the admin manually marks it Completed — not a separate concept, just the not-yet-Completed state. This is what the Client Portal's "active events" list filters on.
_Avoid_: In Progress (that's an Event Task/Assignment Status, not an Event status)

**Completed** (Event status):
The terminal state an admin manually sets once an Event's work is done. A Completed Event is locked read-only and appears in history/archive views.
_Avoid_: Closed, Archived (Archived describes the *view*, Completed is the *state* that produces it)

**Event Attendance**:
A record linking a Contact to a specific Event as an attendee, created manually or automatically from a public Form submission made in that Event's context.

### Assignments

**Assignment**:
A unit of work belonging to exactly one Event. Has a title, description, Status, one or more Tags, a due date, a priority, a Pickup Setting, and zero or more assignees drawn from the Event's Roster. Created and content-edited by the admin only.
_Avoid_: Task, Ticket, To-do

**Subtask**:
An Assignment whose `parent_assignment_id` points at another Assignment. Not a distinct kind of record — a Subtask has every field a top-level Assignment has (its own Status, Tags, assignees, Pickup Setting). A Subtask cannot itself have Subtasks: nesting is capped at one level below a top-level Assignment.
_Avoid_: Sub-assignment, Checklist item

**Status**:
An Assignment's position in its 4-stage lifecycle: Ready to Work, In Progress, Blocked, Done. Any Roster member can move an Assignment's Status; only the admin edits its content.

**Tag**:
A free-text label typed onto an individual Assignment, with no central list or reuse enforcement.
_Avoid_: Category (reserved for the Contact taxonomy — see below), Roster Category (reserved for per-Event Roster grouping — see above)

**Pickup Setting**:
A per-Assignment flag: either only the admin may assign it to chosen Event Staff, or any Roster member may Pick it up.

**Pickup**:
The act of a Roster member self-assigning to an Assignment whose Pickup Setting allows it. Instant, no approval step. Multiple Roster members may pick up the same Assignment if it allows multiple assignees.
_Avoid_: Claim, Self-assign

### Messaging

**Conversation**:
A message thread scoped to one Event, with an explicit, chosen set of participants drawn from that Event's Roster. Never auto-created. Started by the admin always, or by a Roster member only if the Event's staff-conversation setting allows it.
_Avoid_: Chat, Thread, Channel

**Event conversation setting**:
A per-Event flag controlling whether Roster members may start new Conversations for that Event (the admin can always start one, and can always read and post in any Conversation regardless of this setting).

### Contacts & mass email

**Category**:
An admin-managed, reusable tag in the Contact taxonomy (e.g. "VIP"). Admin creates/renames/deletes Categories over time; a Contact can carry several. Client and Event Staff roles imply their own Category automatically, in addition to any custom ones.
_Avoid_: Tag (reserved for Assignments — see above), Segment, Roster Category (reserved for per-Event Roster grouping — see above, under Events)

**Email Send**:
A record of one mass-email dispatch by the admin to a filtered set of Contacts: subject, HTML body, recipients, timestamp, and any number of attached Forms. Sent via AWS SES. Composed fresh each time — there is no saved, reusable Email Template. See [`0009-no-saved-email-templates`](./docs/adr/0009-no-saved-email-templates.md).
_Avoid_: Campaign, Blast, Email Template, Template (no separate reusable-template concept — see ADR above)

**AI draft**:
An Email Send body generated by giving the Anthropic Claude API a plain-language prompt; the admin always edits the result before it's sent — it is never sent unreviewed.

### Forms

**Form**:
A named, admin-authored form definition — an ordered list of fields (each with a type, label, description, required flag, and styling) plus theme settings — that always has exactly one public fill-link. A Form is created once and is optionally scoped to a single Event or Assignment at a time; it is never shared across several Events or Assignments. Independently of that scoping, a Form can also be attached to any number of Email Sends (including zero, one, or many) — the same Form may be reused across several Email Sends. A Form scoped to neither an Event/Assignment nor any Email Send is standalone (not yet placed anywhere, or intentionally general-purpose). See [`0008-forms-are-not-reusable-templates`](./docs/adr/0008-forms-are-not-reusable-templates.md) and [`0010-forms-can-email-send-multi-attach`](./docs/adr/0010-forms-can-email-send-multi-attach.md).
_Avoid_: Form Template, Template (there is no separate reusable-template concept — reuse of an Event/Assignment scope means creating another Form), Attach (as a bare verb for Event/Assignment scoping — say "scope a Form to X" there; "attach" is reserved for the Form-to-Email-Send relationship, which is the one exception that's actually many-to-many)

**Submission**:
One person's filled-out answers to a Form, made through a public, no-login-required link. May include uploaded files. If made through a Form scoped to an Event or Assignment, and the submitter's email doesn't match an existing Contact, it creates one and an Event Attendance record for that Event.
_Avoid_: Response, Entry

### Client Portal

**Event Task**:
An admin-authored unit of client-visible work on an Event: a title, a description, and a Status. Distinct from Assignment — an Event Task has no assignee (Assignment's assignees are drawn from the Event Roster, which Clients aren't part of) and none of Assignment's staff-only fields (Tags, Priority, Pickup Setting). Only the admin creates and edits an Event Task; the Client sees it and its Updates read-only.
_Avoid_: Assignment (reserved for staff-facing work — see above), Task (too generic; always say "Event Task")

**Event Task Status**:
An Event Task's position in its 4-stage lifecycle: Not Started, In Progress, Blocked, Done. Distinct from Assignment's Status (Ready to Work / In Progress / Blocked / Done) — same shape, separate enum, because Event Task has no admin/staff split in who moves it: only the admin does.

**Event Task Update**:
A timestamped, admin-authored note posted to an Event Task, visible to the Client. Mirrors Assignment Comment's shape (chronological, append-only) but single-author (admin only) rather than dual-author, since Clients don't post to their own Event Tasks.
_Avoid_: Assignment Comment (reserved for the Assignment-facing equivalent — see above)

**Request**:
An admin-authored ask directed at a Client, scoped to one Event. Has a title, sometimes a due date, and may require the Client to upload a file. The Client's analog of an Assignment, but a separate table — Assignment's Roster-drawn assignee model doesn't fit a Client, and a Request needs file-upload capability and a Fulfillment Setting Assignment doesn't have. Has no Status field — a Request is either fulfilled or not, tracked by Fulfilled At.
_Avoid_: Assignment (reserved for staff-facing work — see above), Task (reserved for Event Task — see above)

**Fulfillment Setting**:
A per-Request flag the admin sets when creating a Request that requires a file: either the upload alone sets Fulfilled At immediately, or the admin must review the upload and mark it fulfilled by hand. A Request that doesn't require a file is always fulfilled by the admin manually. Mirrors how Pickup Setting is a per-Assignment flag governing how an Assignment moves, not the movement itself.

**Fulfilled At**:
The timestamp marking a Request as satisfied — set automatically on upload (if the Request's Fulfillment Setting allows it) or manually by the admin. Null means outstanding. Gates any Event Task that depends on the Request via a Request Dependency.

**Request Dependency**:
A structural link from an Event Task to a Request it's blocked on, admin-configured. While the linked Request's Fulfilled At is null, the Event Task's Status cannot move into In Progress or Done — mirroring how `assignment_dependencies` gates an Assignment's Status, blocking the transition rather than silently forcing the Event Task's Status to Blocked. One-directional only: a Request can block an Event Task, but Event Tasks don't depend on each other (unlike Assignments, which can).
_Avoid_: Assignment Dependency (reserved for the Assignment-to-Assignment equivalent)

**Documentation**:
An admin-uploaded file made visible to a Client, with a title and a description, scoped to exactly one Event — never reused across Events (unlike Form, which can attach to several Email Sends).
_Avoid_: Document (fine informally, but "Documentation" is the record name), Attachment (reserved for the Form-to-Email-Send relationship — see above)

**Vendor**:
A role attached to a Contact: an external party (caterer, photographer, DJ, ...) the admin tracks and can make visible to Clients. Structurally mirrors Client and Event Staff (its own table, `contact_id` unique to a Contact) but carries no login — a Vendor never authenticates, unlike Client and Event Staff.
_Avoid_: Event Staff (Vendor is external, never on a Roster, never assigned Assignments), Contact (a Vendor is a Contact playing this role, not the base identity itself)

**Vendor Category**:
A fixed, single label on a Vendor record itself (e.g. "Caterer", "Photographer") describing what kind of vendor they are — set once on the Vendor, not per-Event.
_Avoid_: Category (reserved for the global Contact taxonomy — see below; Vendor Category is a field on Vendor, not a Category tag), Roster Category (reserved for per-Event Roster grouping — see above)

**Event Vendor List**:
The explicit set of Vendors the admin has added to a specific Event, visible to that Event's Client. Configured per Event only — never at Client Application acceptance, since accepting an Application creates just a Client record, before any Event exists.
_Avoid_: Roster (reserved for Event Staff — see above)
