# Handled Properly

An events-staffing portal: a single admin manages clients, events, event staff, task assignments, in-event messaging, mass email, and fillable forms.

## Language

### Identity & roles

**Contact**:
The base identity record for any real person the system knows about (name, email, phone). Every person — however they relate to the business — is exactly one Contact.
_Avoid_: Person, User (User is a Supabase Auth concept, not a domain term)

**Client**:
A role attached to a Contact: someone who hires Handled Properly to staff an Event. A Client can have many Events. Clients do not log in.
_Avoid_: Customer, Account

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

**Completed** (Event status):
The terminal state an admin manually sets once an Event's work is done. A Completed Event is locked read-only and appears in history/archive views.
_Avoid_: Closed, Archived (Archived describes the *view*, Completed is the *state* that produces it)

**Event Attendance**:
A record linking a Contact to a specific Event as an attendee, created manually or automatically from a public Form submission made in that Event's context.

### Assignments

**Assignment**:
A unit of work belonging to exactly one Event. Has a title, description, Status, one or more Tags, a due date, a priority, a Pickup Setting, and zero or more assignees drawn from the Event's Roster. Created and content-edited by the admin only.
_Avoid_: Task, Ticket, To-do

**Sub-assignment**:
An Assignment whose `parent` points at another Assignment. Not a distinct kind of record — a sub-assignment has every field a top-level Assignment has (its own Status, Tags, assignees, Pickup Setting).
_Avoid_: Subtask, Checklist item

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
