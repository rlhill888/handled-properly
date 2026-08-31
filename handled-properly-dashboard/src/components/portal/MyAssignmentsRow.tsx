import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getMyAssignments } from "@/lib/data/my-assignments";
import LockIcon from "@/components/portal/LockIcon";
import styles from "@/styles/admin-shared.module.css";
import cardStyles from "@/styles/assignments-board.module.css";

const STATUS_LABEL = {
  ready: "Ready to Work",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
} as const;

// Staff /portal dashboard only — a compact, read-only row of everything
// currently assigned to this staff member, across events. The full
// interactive card (status change, pickup, comments) lives on the per-event
// board (StaffAssignmentCard) instead; this is deliberately a lighter
// summary, so it links out to that board rather than acting in place.
export default async function MyAssignmentsRow({ currentStaffId }: { currentStaffId: string }) {
  const supabase = await createSupabaseServerClient();
  const myAssignments = await getMyAssignments(supabase, currentStaffId);

  if (myAssignments.length === 0) {
    return <p className={styles.emptyState}>Nothing currently assigned to you.</p>;
  }

  return (
    <div className={styles.assignmentCardRow}>
      {myAssignments.map((assignment) => {
        const isBlocked = assignment.isBlocked;

        return (
          <Link
            key={assignment.id}
            href={`/portal/staff/events/${assignment.eventId}/assignments`}
            className={`${styles.assignmentCompactCard} ${isBlocked ? styles.assignmentCompactCardBlocked : ""}`}
          >
            <div className={styles.assignmentCompactHeader}>
              <span className={styles.assignmentCompactTitle}>
                {isBlocked && (
                  <span className={cardStyles.titleCardBlockedIcon} aria-label="Blocked">
                    <LockIcon size={12} />
                  </span>
                )}{" "}
                {assignment.title}
              </span>
              <span
                className={`${cardStyles.priority} ${cardStyles[`priority_${assignment.priority}`]}`}
              >
                {assignment.priority}
              </span>
            </div>
            {isBlocked && (
              <span className={cardStyles.depPending} style={{ alignSelf: "flex-start" }}>
                Blocked
              </span>
            )}
            <span className={styles.assignmentCompactMeta}>{assignment.eventName}</span>
            <span className={styles.assignmentCompactMeta}>
              {[
                isBlocked ? null : STATUS_LABEL[assignment.status],
                assignment.dueDate && `Due ${new Date(assignment.dueDate).toLocaleDateString()}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
