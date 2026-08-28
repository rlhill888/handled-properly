import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { ADMIN_LINKS } from "@/lib/portal-nav";
import styles from "../portal-shell.module.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "admin") redirect("/portal");

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Admin" links={ADMIN_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
