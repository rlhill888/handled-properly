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
_Avoid_: Category (reserved for the Contact taxonomy — see below)

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
_Avoid_: Tag (reserved for Assignments — see above), Segment

**Email Send**:
A record of one mass-email dispatch by the admin to a filtered set of Contacts: subject, HTML body, recipients, timestamp, and an optional Form Attachment. Sent via AWS SES.
_Avoid_: Campaign, Blast

**Email Template**:
A saved, reusable HTML email body an admin can recall and edit into a future Email Send. May originate from a manually composed email or from an AI-assisted draft.

**AI draft**:
An Email Template or Email Send body generated by giving the Anthropic Claude API a plain-language prompt; the admin always edits the result before it's saved or sent — it is never sent unreviewed.

### Forms

**Form Template**:
A named, reusable, admin-authored form definition: an ordered list of fields (each with a type, label, description, required flag, and styling) plus template-level theme settings. Not tied to any single Event, Assignment, or Email Send.
_Avoid_: Form (ambiguous between the template and a filled-out instance)

**Form Attachment**:
A link from one Form Template to a specific Event, Assignment, or Email Send, making the template's fill-link available in that context. Each attachment carries its own independent staff-visibility setting — the same Form Template can be staff-visible on one Event and admin-only on another.
_Avoid_: Attach, Link (as bare verbs — always say "attach a Form Template to X")

**Submission**:
One person's filled-out answers to a Form Template, made through a public, no-login-required link. May include uploaded files. If made through an Event or Assignment's Form Attachment, and the submitter's email doesn't match an existing Contact, it creates one and an Event Attendance record for that Event.
_Avoid_: Response, Entry
