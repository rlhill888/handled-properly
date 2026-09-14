import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { VENDOR_LINKS } from "@/lib/portal-nav";
import styles from "../portal-shell.module.css";

export default async function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "vendor") redirect("/portal");

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Vendor" links={VENDOR_LINKS} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
