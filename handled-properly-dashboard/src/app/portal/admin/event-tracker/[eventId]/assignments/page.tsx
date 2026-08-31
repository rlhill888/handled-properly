import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getAssignmentsBoardData } from "./data";
import AssignmentCard, { type AssignmentData } from "./AssignmentCard";
import NewAssignmentForm from "./NewAssignmentForm";
import AddModalButton from "@/components/portal/AddModalButton";
import styles from "@/styles/admin-shared.module.css";
import boardStyles from "@/styles/assignments-board.module.css";

const COLUMNS: { status: AssignmentData["status"]; label: string }[] = [
  { status: "ready", label: "Ready to Work" },
  { status: "in_progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
];

export default async function EventAssignmentsDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const isLocked = event.status === "completed";
  const { assignments, rosterStaff, availableForms, siteUrl, allAssignments } =
    await getAssignmentsBoardData(eventId);

  return (
    <div className={styles.page}>
      <Link
        href={`/portal/admin/event-tracker/${eventId}`}
        className={styles.backLink}
        aria-label={`Back to ${event.name}`}
      >
        ←
      </Link>

      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Admin · Assignments</span>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{event.name}</h1>
            {!isLocked && (
              <AddModalButton label="New Assignment" modalTitle="New Assignment">
                <NewAssignmentForm eventId={eventId} rosterStaff={rosterStaff} existingAssignments={allAssignments} />
              </AddModalButton>
            )}
          </div>
          <p className={styles.description}>
            Full detail on every assignment for this event, grouped by status.
          </p>
        </div>
      </div>

      <div className={boardStyles.board}>
        {COLUMNS.map((column) => (
          <div key={column.status} className={boardStyles.column}>
            <div className={boardStyles.columnHeader}>
              <span>{column.label}</span>
              <span>{assignments.filter((a) => a.status === column.status).length}</span>
            </div>
            {assignments
              .filter((a) => a.status === column.status)
              .map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  eventId={eventId}
                  assignment={assignment}
                  rosterStaff={rosterStaff}
                  existingAssignments={allAssignments}
                  isLocked={isLocked}
                  availableForms={availableForms}
                  siteUrl={siteUrl}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
