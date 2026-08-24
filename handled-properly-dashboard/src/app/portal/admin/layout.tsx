import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import styles from "../portal-shell.module.css";

const ADMIN_LINKS = [
  { label: "Clients", href: "/portal/admin/clients" },
  { label: "Forms", href: "/portal/admin/form" },
  { label: "Event Tracker", href: "/portal/admin/event-tracker" },
  { label: "Mass Email Manager", href: "/portal/admin/email-manager" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "admin") redirect("/portal/staff");

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Admin" links={ADMIN_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
