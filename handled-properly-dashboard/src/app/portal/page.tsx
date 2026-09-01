import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import PortalSidebar from "@/components/PortalSidebar";
import ActiveEventsList from "@/components/portal/ActiveEventsList";
import MyAssignmentsRow from "@/components/portal/MyAssignmentsRow";
import { ADMIN_LINKS, STAFF_LINKS, CLIENT_LINKS } from "@/lib/portal-nav";
import shellStyles from "./portal-shell.module.css";
import pageStyles from "@/styles/admin-shared.module.css";

export default async function PortalIndexPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");

  const roleLabel =
    actor.role === "admin" ? "Admin" : actor.role === "client" ? "Client" : "Event Staff";
  const links = actor.role === "admin" ? ADMIN_LINKS : actor.role === "client" ? CLIENT_LINKS : STAFF_LINKS;

  return (
    <div className={shellStyles.shell}>
      <PortalSidebar roleLabel={roleLabel} links={links} />
      <main className={shellStyles.content}>
        {actor.role === "admin" ? (
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
        ) : actor.role === "client" ? (
          <div className={pageStyles.page}>
            <div className={pageStyles.header}>
              <div>
                <span className={pageStyles.eyebrow}>Client</span>
                <h1 className={pageStyles.title}>Welcome back</h1>
                <p className={pageStyles.description}>Your active events.</p>
              </div>
              <Link href="/portal/client/events" className={pageStyles.secondaryButton}>
                View All Events
              </Link>
            </div>

            <h2 className={pageStyles.cardTitle}>Active Events</h2>
            <ActiveEventsList linkBase="/portal/client/events" />
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
