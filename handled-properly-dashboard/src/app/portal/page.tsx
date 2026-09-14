import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import PortalSidebar from "@/components/PortalSidebar";
import ActiveEventsList from "@/components/portal/ActiveEventsList";
import { ADMIN_LINKS, STAFF_LINKS } from "@/lib/portal-nav";
import { getClientLinksWithBadges } from "@/lib/data/client-nav-links";
import shellStyles from "./portal-shell.module.css";
import pageStyles from "@/styles/admin-shared.module.css";

export default async function PortalIndexPage() {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");

  // Event Staff has no dashboard of its own here — send it straight to its
  // events list instead of building a "Welcome back" home screen.
  if (actor.role === "event_staff") redirect("/portal/staff/events");

  // Same reasoning as Event Staff above — Vendor has no dashboard of its
  // own, just a list of the Events it's on.
  if (actor.role === "vendor") redirect("/portal/vendor/events");

  // Omitted for the Client portal — see PortalSidebar's roleLabel prop.
  const roleLabel = actor.role === "admin" ? "Admin" : undefined;

  let links = actor.role === "admin" ? ADMIN_LINKS : STAFF_LINKS;
  if (actor.role === "client") {
    const supabase = await createSupabaseServerClient();
    links = await getClientLinksWithBadges(supabase);
  }

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
        ) : (
          <div className={pageStyles.page}>
            <div className={pageStyles.header}>
              <div>
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
        )}
      </main>
    </div>
  );
}
