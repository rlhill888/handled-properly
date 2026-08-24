---
status: accepted
---

# Sub-assignments are full Assignment rows via a self-referential parent link

We considered a lighter-weight checklist-item entity for sub-assignments (title + checkbox, no independent status/assignees/tags), since that's the more common pattern for "subtask." We rejected it: the requirement is that a sub-assignment can be picked up, worked, and tracked through the same 4-stage board as any other Assignment, by staff who may not be the same people working the parent. A checklist item can't carry that.

So a sub-assignment is just an Assignment with `parent_assignment_id` set — same Status enum, same Tags, same assignees, same Pickup Setting. A reader seeing sub-assignments with full kanban behavior might expect a separate, simpler model; this note is here so they don't "simplify" it into one.
