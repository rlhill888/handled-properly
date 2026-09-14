import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import StaffAssignmentDetail from "../StaffAssignmentDetail";
import { getStaffAssignments, findAssignment } from "../data";
import styles from "@/styles/admin-shared.module.css";
import detailStyles from "../StaffAssignmentCard.module.css";

export default async function StaffAssignmentDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; assignmentId: string }>;
}) {
  const { eventId, assignmentId } = await params;
  const supabase = await createSupabaseServerClient();
  const actor = await getCurrentActor();
  const currentStaffId = actor?.role === "event_staff" ? actor.eventStaffId : null;

  // RLS (staff_select_rostered_events) scopes this to events the signed-in
  // staff member is rostered on — a direct link to any other event's id
  // simply returns no row.
  const { data: event } = await supabase
    .from("events")
    .select("id, name, status")
    .eq("id", eventId)
    .maybeSingle();

  if (!event) notFound();

  const assignments = await getStaffAssignments(eventId);
  const assignment = findAssignment(assignments, assignmentId);
  if (!assignment) notFound();

  const isLocked = event.status === "completed";

  return (
    <div className={styles.page}>
      <div className={detailStyles.breadcrumb}>
        <Link href={`/portal/staff/events/${eventId}`} className={detailStyles.breadcrumbLink}>
          {event.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span>Assignment</span>
      </div>

      <StaffAssignmentDetail
        eventId={eventId}
        assignment={assignment}
        currentStaffId={currentStaffId}
        isLocked={isLocked}
      />
    </div>
  );
}
