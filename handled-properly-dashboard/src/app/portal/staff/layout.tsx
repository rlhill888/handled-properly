import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { STAFF_LINKS } from "@/lib/portal-nav";
import styles from "../portal-shell.module.css";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "event_staff") redirect("/portal");

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Event Staff" links={STAFF_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
