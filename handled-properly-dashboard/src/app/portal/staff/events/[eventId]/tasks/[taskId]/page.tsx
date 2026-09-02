import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import EventTaskUpdatesList from "@/components/portal/EventTaskUpdatesList";
import TaskAssignmentCards from "./TaskAssignmentCards";
import styles from "@/styles/admin-shared.module.css";

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
};

export default async function StaffEventTaskDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; taskId: string }>;
}) {
  const { eventId, taskId } = await params;
  const supabase = await createSupabaseServerClient();

  // RLS (staff_select_rostered_event_tasks) scopes this — no row means
  // either the task doesn't exist or this staff member isn't rostered on
  // its event.
  const { data: task } = await supabase
    .from("event_tasks")
    .select("id, title, description, status")
    .eq("id", taskId)
    .eq("event_id", eventId)
    .maybeSingle();

  if (!task) notFound();

  const { data: updateRows } = await supabase
    .from("event_task_updates")
    .select("id, body, created_at")
    .eq("event_task_id", taskId)
    .order("created_at", { ascending: true });

  const updates = (updateRows ?? []).map((u) => ({ id: u.id, body: u.body, createdAt: u.created_at }));

  // RLS (staff_select_rostered_event_task_assignments) scopes this to this
  // task's own event — shows the staff-side work behind it.
  const { data: linkRows } = await supabase
    .from("event_task_assignments")
    .select(
      "assignments(id, title, description, status, tags, due_date, priority, assignment_assignees(event_staff(contacts(name))))"
    )
    .eq("event_task_id", taskId);

  const linkedAssignments = (linkRows ?? [])
    .map((row) => row.assignments)
    .filter((a): a is NonNullable<typeof a> => a !== null)
    .map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      status: a.status,
      tags: a.tags,
      dueDate: a.due_date,
      priority: a.priority,
      assigneeNames: (a.assignment_assignees ?? [])
        .map((aa) => aa.event_staff?.contacts?.name)
        .filter((name): name is string => Boolean(name)),
    }));

  return (
    <div className={styles.page}>
      <Link
        href={`/portal/staff/events/${eventId}/tasks`}
        className={styles.backLink}
        aria-label="Back to Event Tasks"
      >
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Event Staff · Event Task</span>
          <h1 className={styles.title}>{task.title}</h1>
          <div className={styles.metaRow} style={{ marginTop: 8 }}>
            <span className={task.status === "done" ? styles.badge : styles.badgeMuted}>
              {STATUS_LABEL[task.status] ?? task.status}
            </span>
          </div>
        </div>
      </div>

      {task.description && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Description</h2>
          <p>{task.description}</p>
        </div>
      )}

      {linkedAssignments.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Staff Assignments Related To This Task</h2>
          <TaskAssignmentCards assignments={linkedAssignments} />
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Updates</h2>
        <EventTaskUpdatesList updates={updates} />
      </div>
    </div>
  );
}
