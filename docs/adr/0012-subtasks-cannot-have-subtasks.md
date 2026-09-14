---
status: accepted
---

# Subtasks are capped at one level of nesting; "Sub-assignment" is renamed to "Subtask"

The term "Sub-assignment" is renamed to "Subtask" throughout the app and codebase. This is a pure vocabulary change — the underlying model is unchanged, and [`0005-sub-assignments-are-full-assignments`](./0005-sub-assignments-are-full-assignments.md) still holds: a Subtask is a full Assignment row (own Status, Tags, assignees, Pickup Setting), not a lightweight checklist item. 0005 is not rewritten — read "sub-assignment" there as the prior name for what this ADR calls a Subtask.

Alongside the rename, we're adding a structural constraint that didn't exist before: a Subtask cannot itself have Subtasks. `parent_assignment_id` may only point at a top-level Assignment (one whose own `parent_assignment_id` is null) — nesting is capped at one level below a top-level Assignment.

We considered leaving nesting unbounded, matching what the self-referential `parent_assignment_id` column technically allows. We rejected that: the assignment board is a 4-stage Kanban-style view, and nothing about it — or the tree-building/rendering code behind it — is designed to usefully represent or navigate a Subtask-of-a-Subtask-of-a-Subtask hierarchy. Capping at one level keeps every Assignment either "top-level" or "a Subtask of a top-level Assignment," a distinction the UI, the admin's mental model, and any future reporting can rely on.

Enforced with a `before insert or update of parent_assignment_id` trigger on `assignments` (see migration `20260831150000_add_subtask_nesting_constraint.sql`), not a `check` constraint, because the rule requires looking at another row (the prospective parent's own `parent_assignment_id`) — something a plain `check` constraint can't express.
