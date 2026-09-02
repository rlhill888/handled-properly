import Link from "next/link";
import NewAssignmentForm from "./assignments/NewAssignmentForm";
import { getAssignmentsBoardData } from "./assignments/data";
import AddModalButton from "@/components/portal/AddModalButton";
import AssignmentBoardClient from "./AssignmentBoardClient";
import styles from "@/styles/admin-shared.module.css";

export default async function AssignmentsBoard({
  eventId,
  isLocked,
}: {
  eventId: string;
  isLocked: boolean;
}) {
  const { assignments, rosterStaff, allAssignments, eventTasks } = await getAssignmentsBoardData(eventId);

  return (
    <div className={styles.card}>
      <div className={styles.cardHeaderRow}>
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          Staff Assignments
        </h2>
        {!isLocked && (
          <AddModalButton label="New Assignment" modalTitle="New Assignment">
            <NewAssignmentForm
              eventId={eventId}
              rosterStaff={rosterStaff}
              existingAssignments={allAssignments}
              eventTasks={eventTasks}
            />
          </AddModalButton>
        )}
        <Link
          href={`/portal/admin/event-tracker/${eventId}/assignments`}
          className={styles.secondaryButton}
        >
          Edit all Assignments
        </Link>
      </div>

      <AssignmentBoardClient
        eventId={eventId}
        assignments={assignments}
        rosterStaff={rosterStaff}
        existingAssignments={allAssignments}
        eventTasks={eventTasks}
        isLocked={isLocked}
      />
    </div>
  );
}
