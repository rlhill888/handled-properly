import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import PortalSidebar from "@/components/PortalSidebar";
import ActiveEventsList from "@/components/portal/ActiveEventsList";
import MyAssignmentsRow from "@/components/portal/MyAssignmentsRow";
import { ADMIN_LINKS, STAFF_LINKS } from "@/lib/portal-nav";
import shellStyles from "./portal-shell.module.css";
import pageStyles from "@/styles/admin-shared.module.css";

export default async function PortalIndexPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");

  const isAdmin = actor.role === "admin";

  return (
    <div className={shellStyles.shell}>
      <PortalSidebar roleLabel={isAdmin ? "Admin" : "Event Staff"} links={isAdmin ? ADMIN_LINKS : STAFF_LINKS} />
      <main className={shellStyles.content}>
        {isAdmin ? (
          <div className={pageStyles.page}>
            <div className={pageStyles.header}>
              <div>
                <span className={pageStyles.eyebrow}>Admin</span>
                <h1 className={pageStyles.title}>Welcome back</h1>
                <p className={pageStyles.description}>Here&apos;s what&apos;s active right now.</p>
              </div>
              <Link href="/portal/admin/event-tracker" className={pageStyles.secondaryButton}>
                View All Events
              </Link>
            </div>

            <h2 className={pageStyles.cardTitle}>Active Events</h2>
            <ActiveEventsList linkBase="/portal/admin/event-tracker" />
          </div>
        ) : (
          <div className={pageStyles.page}>
            <div className={pageStyles.header}>
              <div>
                <span className={pageStyles.eyebrow}>Event Staff</span>
                <h1 className={pageStyles.title}>Welcome back</h1>
                <p className={pageStyles.description}>Events you&apos;re currently on the roster for.</p>
              </div>
              <Link href="/portal/staff/events" className={pageStyles.secondaryButton}>
                View All Events
              </Link>
            </div>

            <h2 className={pageStyles.cardTitle}>Your Assignments</h2>
            <MyAssignmentsRow currentStaffId={actor.eventStaffId} />

            <h2 className={pageStyles.cardTitle}>Active Events</h2>
            <ActiveEventsList linkBase="/portal/staff/events" />
          </div>
        )}
      </main>
    </div>
  );
}
