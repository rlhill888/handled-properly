import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientLinksWithBadges } from "@/lib/data/client-nav-links";
import styles from "../portal-shell.module.css";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "client") redirect("/portal");

  const supabase = await createSupabaseServerClient();
  const links = await getClientLinksWithBadges(supabase);

  return (
    <div className={styles.shell}>
      <PortalSidebar links={links} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
