import { redirect } from "next/navigation";
import PortalSidebar from "@/components/PortalSidebar";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { CLIENT_LINKS } from "@/lib/portal-nav";
import styles from "../portal-shell.module.css";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const actor = await getCurrentActor();
  if (!actor) redirect("/portal/signin");
  if (actor.role !== "client") redirect("/portal");

  // RLS (client_select_own_requests) already scopes this to only this
  // client's own events — no extra filter needed here.
  const supabase = await createSupabaseServerClient();
  const { count: openRequestCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .is("fulfilled_at", null);

  const links = CLIENT_LINKS.map((link) =>
    link.href === "/portal/client/requests" ? { ...link, badgeCount: openRequestCount ?? 0 } : link
  );

  return (
    <div className={styles.shell}>
      <PortalSidebar roleLabel="Client" links={links} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
