import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import styles from "../portal-shell.module.css";

const STAFF_LINKS = [
  { label: "Event", href: "/portal/staff/event" },
  { label: "Chat", href: "/portal/staff/chat" },
];

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "event_staff") redirect("/portal/admin");

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Event Staff" links={STAFF_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
