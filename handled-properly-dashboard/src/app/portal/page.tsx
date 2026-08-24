import { redirect } from "next/navigation";
import { getCurrentActor } from "@/lib/auth/get-current-actor";

export default async function PortalIndexPage() {
  const actor = await getCurrentActor();

  if (!actor) redirect("/portal/signin");
  redirect(actor.role === "admin" ? "/portal/admin" : "/portal/staff");
}
