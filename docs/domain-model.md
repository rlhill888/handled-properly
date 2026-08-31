# Domain Model

Formal entity/relationship model for the Handled Properly portal. Terms here follow [`CONTEXT.md`](../CONTEXT.md) — read that first for definitions. This document is the schema-shaped complement to that glossary: implementation detail belongs here, not there.

## Entities

### Contact
The base identity for any real person. See [`0002-contact-as-base-identity`](./adr/0002-contact-as-base-identity.md).
- `id`, `name`, `email` (unique), `phone`, `created_at`

### Category
Admin-managed taxonomy applied to Contacts.
- `id`, `name` (unique), `created_at`

### ContactCategory (join)
- `contact_id` → Contact, `category_id` → Category

### Client (role)
- `id`, `contact_id` → Contact (unique — 1:1), `company_name`, `notes`

### EventStaff (role)
- `id`, `contact_id` → Contact (unique — 1:1), `auth_user_id` (Supabase Auth), `invited_at`, `invite_status`

### Admin
Singleton operator account, not a Contact — the admin isn't a person the system tracks business relationships with, just an auth identity with unrestricted access.
- `id`, `auth_user_id` (Supabase Auth)

### EventSeries
- `id`, `client_id` → Client, `label`, `created_at`

### Event
- `id`, `client_id` → Client, `series_id` → EventSeries (nullable — null for one-time events), `name`, `starts_at`, `location`, `status` (`active` | `completed`), `completed_at`, `staff_can_start_conversations` (bool)

### RosterEntry (join)
The Event ↔ EventStaff relationship. See [`0004-explicit-event-roster`](./adr/0004-explicit-event-roster.md).
- `event_id` → Event, `event_staff_id` → EventStaff, `added_at`

### EventAttendance (join)
The Event ↔ Contact relationship that makes a Contact "an attendee."
- `event_id` → Event, `contact_id` → Contact, `source` (`manual` | `form_submission`), `created_at`

### Assignment
Subtasks are Assignment rows with `parent_assignment_id` set, capped at one level of nesting — see [`0005-sub-assignments-are-full-assignments`](./adr/0005-sub-assignments-are-full-assignments.md) and [`0012-subtasks-cannot-have-subtasks`](./adr/0012-subtasks-cannot-have-subtasks.md). Tags are a plain string array, not a separate table (no central taxonomy).
- `id`, `event_id` → Event, `parent_assignment_id` → Assignment (nullable, self-referential), `title`, `description`, `status` (`ready` | `in_progress` | `blocked` | `done`), `tags` (text[]), `due_date`, `priority` (`low` | `medium` | `high`), `pickup_setting` (`admin_only` | `open_pickup`), `created_at`

### AssignmentAssignee (join)
- `assignment_id` → Assignment, `event_staff_id` → EventStaff, `assigned_via` (`admin` | `pickup`), `assigned_at`

### Conversation
- `id`, `event_id` → Event, `created_by` → EventStaff or Admin (polymorphic — see note below), `created_at`

### ConversationParticipant (join)
Explicit participants drawn from the Event's Roster. The Admin is not stored here — Admin access to every Conversation is a permission rule, not membership (see [`0004`](./adr/0004-explicit-event-roster.md) reasoning: same principle — access derives from role, not a join row).
- `conversation_id` → Conversation, `event_staff_id` → EventStaff

### Message
- `id`, `conversation_id` → Conversation, `sender` → EventStaff or Admin (polymorphic), `body`, `created_at`

### EmailSend
- `id`, `subject`, `body_html`, `form_id` → Form (nullable), `sent_at`

### EmailRecipient (join)
Snapshot of who a given send actually went to (filters are evaluated at send time, not stored as a live query).
- `email_send_id` → EmailSend, `contact_id` → Contact

### Form
Not a reusable template — each Form belongs to at most one target and is never shared across several; reuse means creating another Form. See [`0008-forms-are-not-reusable-templates`](./adr/0008-forms-are-not-reusable-templates.md) (supersedes [`0006-per-attachment-form-visibility`](./adr/0006-per-attachment-form-visibility.md)).
- `id`, `name`, `theme` (json), `target_type` (`event` | `assignment` | `email_send`, nullable — null means standalone/unassigned), `target_id` (nullable), `staff_visible` (bool), `created_at`

### FormField
- `id`, `form_id` → Form, `order`, `label`, `description`, `type` (`text` | `email` | `tel` | `number` | `date` | `textarea` | `select` | `file`), `required` (bool), `styling` (json)

### Submission
- `id`, `form_id` → Form, `contact_id` → Contact (created/matched by email if new), `submitted_at`

### SubmissionAnswer
- `id`, `submission_id` → Submission, `form_field_id` → FormField, `value`, `file_ref` (nullable — Supabase Storage path)

## Relationships (cardinality)

```
Contact          1 ── 0/1  Client
Contact          1 ── 0/1  EventStaff
Contact          * ── *    Category            (via ContactCategory)
Contact          * ── *    Event               (via EventAttendance, as attendee)

Client           1 ── *    Event
Client           1 ── *    EventSeries
EventSeries      1 ── *    Event               (0/1 series per event)

Event            * ── *    EventStaff          (via RosterEntry)
Event            1 ── *    Assignment
Event            1 ── *    Conversation
Event            1 ── *    EventAttendance

Assignment       0/1 ── *  Assignment          (parent/subtasks, self-referential, capped at one level)
Assignment       * ── *    EventStaff          (via AssignmentAssignee — subset of that Event's Roster)

Conversation     * ── *    EventStaff          (via ConversationParticipant — subset of that Event's Roster)
Conversation     1 ── *    Message

Form             1 ── *    FormField
Form             1 ── *    Submission          (target: Event | Assignment | EmailSend, nullable)
Submission       1 ── *    SubmissionAnswer
Submission       * ── 1    Contact

EmailSend        * ── *    Contact             (via EmailRecipient, snapshot at send time)
EmailSend        0/1 ── 1  Form
```

## Notes on borderline modeling choices

- **`created_by` / `sender` are polymorphic (EventStaff or Admin).** The Admin isn't a Contact or an EventStaff, but can create Conversations and post Messages. Implementation will need either a nullable pair of FKs (`admin_id` / `event_staff_id`, exactly one set) or a `sender_type` discriminator column — deferred to implementation, not a domain question.
- **`AssignmentAssignee.event_staff_id` and `ConversationParticipant.event_staff_id` must be validated as a subset of that Event's `RosterEntry`** at the application level; the relational model doesn't enforce "assignee must be on the roster" structurally without a composite-FK trick that isn't worth the complexity here.
- **Tags are a string array on Assignment, not a table**, per the explicit "free-text, no central list" decision (contrast with Category, which *is* a table).
