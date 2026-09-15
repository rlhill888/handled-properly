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
A single occurrence of work for a Client. Owns its own Roster, Assignments, Conversations, and (once Completed) its own history record. May span multiple consecutive days (a date range) rather than a single instant — see [`0015-multi-day-events-as-a-date-range`](./docs/adr/0015-multi-day-events-as-a-date-range.md). Recurring events are not linked to one another; each is created and tracked independently — see [`0003-event-series-as-independent-occurrences`](./docs/adr/0003-event-series-as-independent-occurrences.md) (superseded: the Event Series grouping that ADR describes has since been removed).
_Avoid_: Job, Gig, Booking

**Roster**:
The explicit set of Event Staff added to an Event by the admin. Roster membership — not Assignment assignment — determines who can see the Event, be added to its Conversations, and be assigned/pick up its Assignments.
_Avoid_: Team, Assigned staff

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
A unit of work belonging to exactly one Event. Has a title, description, Status, a due date, a priority, a Pickup Setting, and zero or more assignees drawn from the Event's Roster. Created and content-edited by the admin only. Can also be associated with one Event Task, admin-set from either record's own edit form — informational only, it doesn't gate either record's Status, and exists so a Staff member looking at an Event Task can see the Assignment(s) doing the work behind it.
_Avoid_: Task, Ticket, To-do

**Subtask**:
An Assignment whose `parent_assignment_id` points at another Assignment. Not a distinct kind of record — a Subtask has every field a top-level Assignment has (its own Status, assignees, Pickup Setting). A Subtask cannot itself have Subtasks: nesting is capped at one level below a top-level Assignment.
_Avoid_: Sub-assignment, Checklist item

**Status**:
An Assignment's position in its 4-stage lifecycle: Not Started, In Progress, Blocked, Done. Any Roster member can move an Assignment's Status; only the admin edits its content.

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
_Avoid_: Segment

**Email Send**:
A record of one mass-email dispatch by the admin to a filtered set of Contacts: subject, HTML body, recipients, timestamp, and any number of attached Forms. Sent via AWS SES. Composed fresh each time — there is no saved, reusable Email Template. See [`0009-no-saved-email-templates`](./docs/adr/0009-no-saved-email-templates.md).
_Avoid_: Campaign, Blast, Email Template, Template (no separate reusable-template concept — see ADR above)

**AI draft**:
An Email Send body generated by giving the Anthropic Claude API a plain-language prompt; the admin always edits the result before it's sent — it is never sent unreviewed.

### Forms

**Form**:
A named, admin-authored form definition — an ordered list of fields (each with a type, label, description, required flag, and styling) plus theme settings — that always has exactly one public fill-link. A Form is created once and is either standalone (not yet placed anywhere, or intentionally general-purpose) or attached to any number of Email Sends (including zero, one, or many) — the same Form may be reused across several Email Sends. A Form can no longer be scoped to a single Event or Assignment — that capability was removed; see [`0008-forms-are-not-reusable-templates`](./docs/adr/0008-forms-are-not-reusable-templates.md), [`0010-forms-can-email-send-multi-attach`](./docs/adr/0010-forms-can-email-send-multi-attach.md), and [`0014-forms-no-longer-scoped-to-event-or-assignment`](./docs/adr/0014-forms-no-longer-scoped-to-event-or-assignment.md).
_Avoid_: Form Template, Template (there is no separate reusable-template concept — reuse means creating another Form), Event/Assignment scope (retired — see 0014)

**Submission**:
One person's filled-out answers to a Form, made through a public, no-login-required link. May include uploaded files. If the submitter's email doesn't match an existing Contact, it creates one.
_Avoid_: Response, Entry

### Client Portal

**Event Task**:
An admin-authored unit of client-visible work on an Event: a title, a description, and a Status. Distinct from Assignment — an Event Task has no assignee (Assignment's assignees are drawn from the Event Roster, which Clients aren't part of) and none of Assignment's staff-only fields (Priority, Pickup Setting). Only the admin creates and edits an Event Task; the Client sees it and its Updates read-only, and a rostered Event Staff member sees the same read-only view (plus which Assignments are associated with it) for Events they're on.
_Avoid_: Assignment (reserved for staff-facing work — see above), Task (too generic; always say "Event Task")

**Event Task Status**:
An Event Task's position in its 4-stage lifecycle: Not Started, In Progress, Blocked, Done. Distinct from Assignment's Status (same shape, same 4 stages) — a separate enum, because Event Task has no admin/staff split in who moves it: only the admin does.

**Event Task Update**:
A timestamped, admin-authored note posted to an Event Task, visible to the Client. Mirrors Assignment Comment's shape (chronological, append-only) but single-author (admin only) rather than dual-author, since Clients don't post to their own Event Tasks.
_Avoid_: Assignment Comment (reserved for the Assignment-facing equivalent — see above)

**Request**:
An admin-authored ask directed at a Client, scoped to one Event. Has a title, sometimes a due date, and a Request Type governing what the Client must do to satisfy it. The Client's analog of an Assignment, but a separate table — Assignment's Roster-drawn assignee model doesn't fit a Client, and a Request needs a Request Type and a Fulfillment Setting Assignment doesn't have. Has no Status field — a Request is either fulfilled or not, tracked by Fulfilled At.
_Avoid_: Assignment (reserved for staff-facing work — see above), Task (reserved for Event Task — see above)

**Request Type**:
A per-Request flag the admin sets when creating a Request, fixed for the Request's lifetime: File (the Client uploads a file), Text (the Client types and submits a response), or Checkbox (the Client just checks it off — no data entered). Governs which single client-facing action a Request's detail page shows.

**Fulfillment Setting**:
A per-Request flag the admin sets when creating a Request, applying uniformly across every Request Type: either the Client's action (uploading, submitting text, or checking off) sets Fulfilled At immediately, or the admin must review it and mark it fulfilled by hand. Mirrors how Pickup Setting is a per-Assignment flag governing how an Assignment moves, not the movement itself.

**Fulfilled At**:
The timestamp marking a Request as satisfied — set automatically on the Client's action (if the Request's Fulfillment Setting allows it) or manually by the admin. Null means outstanding. Gates any Event Task that depends on the Request via a Request Dependency.

**Request Comment**:
A timestamped note posted to a Request, authored by either the admin or the Request's Client. Mirrors Assignment Comment's dual-author shape (chronological, append-only, exactly one author) rather than Event Task Update's admin-only shape, since a Request is two-way: the Client is expected to act on it and may need to ask a question back.
_Avoid_: Event Task Update (reserved for the Event-Task-facing, admin-only equivalent — see above)

**Request Dependency**:
A structural link from an Event Task to a Request it's blocked on, admin-configured. While the linked Request's Fulfilled At is null, the Event Task's Status cannot move into In Progress or Done — mirroring how `assignment_dependencies` gates an Assignment's Status, blocking the transition rather than silently forcing the Event Task's Status to Blocked. One-directional only: a Request can block an Event Task, but Event Tasks don't depend on each other (unlike Assignments, which can).
_Avoid_: Assignment Dependency (reserved for the Assignment-to-Assignment equivalent)

**Documentation**:
An admin-uploaded file made visible to a Client, with a title and a description, scoped to exactly one Event — never reused across Events (unlike Form, which can attach to several Email Sends).
_Avoid_: Document (fine informally, but "Documentation" is the record name), Attachment (reserved for the Form-to-Email-Send relationship — see above)

**Vendor**:
A role attached to a Contact: an external party (caterer, photographer, DJ, ...) the admin makes visible to an Event's Client by adding them to that Event's Event Vendor List (`event_vendors`). May optionally log into the Vendor Portal — admin invite, mirroring the Client/Event Staff invite/set-password flow — to see that Event's Vendor Event Detail. Unlike Event Staff/Client, a Vendor's login isn't necessarily permanent: the admin can flag a given Event's access to auto-expire once that Event is Completed. See [`0016-vendors-can-log-in`](./docs/adr/0016-vendors-can-log-in.md).
_Avoid_: Event Staff (Vendor is external, never on a Roster, never assigned Assignments), Contact (a Vendor is a Contact playing this role on a given Event, not the base identity itself)

**Event Vendor List**:
The explicit set of Contacts the admin has added as Vendors to a specific Event (`event_vendors`), visible to that Event's Client. Configured per Event only — never at Client Application acceptance, since accepting an Application creates just a Client record, before any Event exists. Managed entirely from the Event's own Edit Vendors modal: search existing Contacts by name to add them, or create a brand new Contact on the spot — there's no standalone Vendors admin page.
_Avoid_: Roster (reserved for Event Staff — see above)

**Vendor Event Detail**:
The admin-authored record of what one Vendor needs to know for one Event: arrival time and location, an optional setup time/location and a photo of where to set up, parking instructions, and the admin's own notes — never shown to the Vendor, but visible to that Event's Roster (Event Staff). One per Event Vendor List entry — mirrors how Request is Client's per-Event, admin-authored ask. Read-only from the Vendor's side; the Vendor's own equivalent going the other direction is Vendor Need, below.
_Avoid_: Request (reserved for the Client-facing equivalent — see above), Notes (reserved informally for the admin_notes field alone, which is never Vendor-visible but is Roster-visible)

**Vendor Need**:
A free-text item a Vendor tells the admin they need for an Event (e.g. "2 six-foot tables", "power outlet nearby") — Vendor-authored, the reverse direction of Vendor Event Detail. A Vendor adds or removes their own Needs from the Vendor Portal, until the Event's optional Vendor Needs Deadline passes (Needs already added stay visible and removable after that point — only adding new ones is blocked). The admin sees every Vendor's Needs on that Event's Vendor Details card, read-only. One row per item, not one text blob, so removing a single fulfilled item doesn't require retyping the rest.
_Avoid_: Request (reserved for the Client-facing, admin-authored equivalent — see above), Vendor Event Detail (reserved for the admin-authored arrival/setup/parking record — see above)

**Vendor Needs Deadline**:
An optional, admin-set cutoff (`events.vendor_needs_due_date`) after which Vendors can no longer add new Vendor Needs to that Event. Null means no deadline. A plain Event-level setting, like `header_image_path` or the staff-conversation flag — not its own table — since it applies to the Event as a whole, not any one Vendor.
_Avoid_: Due Date (reserved informally for Assignment/Request's per-item due dates, a different concept)

### Public website content

Admin-managed content shown on the public marketing site (`/`, `/about`, `/events`, `/contact`), edited from `/portal/admin/website`. Read by public pages via the service-role client, not a per-session one — see [`0017-blog-posts-are-not-linked-to-events`](./docs/adr/0017-blog-posts-are-not-linked-to-events.md).

**Blog Post**:
An admin-authored write-up of a past event, shown on the public `/events` page and (when Featured) on the homepage. Has a title, slug, category, event date, and cover image as fixed fields, plus a body composed of Content Blocks. Not linked to an Event — see [`0017-blog-posts-are-not-linked-to-events`](./docs/adr/0017-blog-posts-are-not-linked-to-events.md).
_Avoid_: Event (reserved for the internal staffing occurrence — see above), Event Story, Case Study, Portfolio Piece

**Featured** (Blog Post):
A per-Blog-Post admin flag controlling whether it appears in the homepage's featured grid, in addition to always appearing on `/events`.

**Trusted Partner**:
An admin-managed entry (name + optional logo) shown in the homepage's "Trusted By" strip. Not a Client, Vendor, or any other Contact role — purely display copy, with no login, no relationship to any real Event or Contact record.
_Avoid_: Client, Vendor (both are Contact roles tied to real people/companies the system tracks relationships with; a Trusted Partner is just a name and logo for display)

**About Content**:
The public `/about` page's content, composed entirely of Content Blocks (there is no separate headline/body field — the page's headline is just the first block's content). A singleton — there is exactly one, not a list.

**Content Block**:
One reusable, admin-stacked section of a page's content — either a Blog Post's body or the whole of About Content. Eight types: `title` (plain text heading — optionally a second muted-gray line, and optionally a short side-by-side supporting paragraph with a divider between them), `paragraph` (rich text, italic only), `image` (a single image with an optional caption and an optional grayscale filter), `image_text` (image + rich text side by side, bold/italic toolbar, optionally styled as a dark "statement" banner), `gallery` (a grid of images with titles/captions, or a `carousel` display mode with arrows/dots and optional pausable autoplay), `divider` (a plain horizontal rule with no fields), `features` (a numbered grid of short title+description items, numbers computed at render time from position), and `cta` (a full-width heading + single button banner, light or dark). Stored as an ordered JSON array (`blocks`), edited via the admin's `BlockEditor` (add/delete, reorder by dragging a handle or by Move Up/Down buttons) and, for rich-text blocks, a `RichTextEditor` whose toolbar varies by block type. See [`0018-four-content-block-types`](./docs/adr/0018-four-content-block-types.md) for why the type list started small, [`0019-sanitize-block-html-server-side`](./docs/adr/0019-sanitize-block-html-server-side.md) for why block HTML is sanitized before storage, [`0023-title-and-paragraph-replace-text`](./docs/adr/0023-title-and-paragraph-replace-text.md) for why Title and Paragraph are separate types rather than one generic Text block, [`0024-remove-highlight-and-narrow-image-text-toolbar`](./docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md) for why there's no highlight anywhere and Image & Text has no headings, [`0025-drag-to-reorder-blocks`](./docs/adr/0025-drag-to-reorder-blocks.md) for why dragging was added back alongside the buttons rather than replacing them, and [`0030-heading-and-features-and-cta-blocks`](./docs/adr/0030-heading-and-features-and-cta-blocks.md) for Title's muted/supporting text and the Features/CTA additions.
_Avoid_: Section, Widget, Component (Component is a React/code term, not a domain one)
