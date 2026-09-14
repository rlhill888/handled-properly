import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { CLIENT_LINKS, type PortalNavLink } from "@/lib/portal-nav";

// Shared by /portal (the post-login landing page, before the Client has
// navigated into /portal/client/*) and the Client layout itself — both need
// the Requests nav link's outstanding-count badge, and computing it in only
// one of the two left the badge missing on first login.
export async function getClientLinksWithBadges(
  supabase: SupabaseClient<Database>
): Promise<PortalNavLink[]> {
  // RLS (client_select_own_requests) already scopes this to only this
  // client's own events — no extra filter needed here.
  const { count: openRequestCount } = await supabase
    .from("requests")
    .select("id", { count: "exact", head: true })
    .is("fulfilled_at", null);

  return CLIENT_LINKS.map((link) =>
    link.href === "/portal/client/requests" ? { ...link, badgeCount: openRequestCount ?? 0 } : link
  );
}
