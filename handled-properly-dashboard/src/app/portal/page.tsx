import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import PortalSidebar from "@/components/PortalSidebar";
import PortalPlaceholder from "@/components/PortalPlaceholder";
import ActiveEventsList from "@/components/portal/ActiveEventsList";
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

            <div className={pageStyles.card}>
              <h2 className={pageStyles.cardTitle}>Active Events</h2>
              <ActiveEventsList />
            </div>
          </div>
        ) : (
          <PortalPlaceholder
            eyebrow="Event Staff"
            title="Welcome back"
            description="Use the menu to view your events or jump into chat."
          />
        )}
      </main>
    </div>
  );
}
