"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findOrCreateContact } from "@/lib/data/contacts";
import { generateApplicationSummary } from "@/lib/ai-application-summary";

export type ActionState = { error: string } | null;

// Lazily generates and caches the AI summary the first time an admin opens
// an Application — see docs/adr/0011-client-applications-are-not-forms.md.
export async function getOrGenerateApplicationSummary(
  applicationId: string,
): Promise<{ summary: string } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: application, error: fetchError } = await supabase
    .from("client_applications")
    .select("ai_summary, event_date, guest_count, location, budget, message")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!application) return { error: "Application not found." };
  if (application.ai_summary) return { summary: application.ai_summary };

  let summary: string;
  try {
    summary = await generateApplicationSummary({
      eventDate: application.event_date,
      guestCount: application.guest_count,
      location: application.location,
      budget: application.budget,
      message: application.message,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI summary failed. Try again." };
  }

  const { error: updateError } = await supabase
    .from("client_applications")
    .update({ ai_summary: summary })
    .eq("id", applicationId);
  if (updateError) return { error: updateError.message };

  return { summary };
}

export async function convertApplicationToClient(applicationId: string): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { data: application, error: fetchError } = await supabase
    .from("client_applications")
    .select("contact_id, name, email, phone, company_name")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError) return { error: fetchError.message };
  if (!application) return { error: "Application not found." };

  const contact = application.contact_id
    ? { id: application.contact_id }
    : await findOrCreateContact(supabase, {
        name: application.name,
        email: application.email,
        phone: application.phone,
      });
  if ("error" in contact) return { error: contact.error };

  const { error: clientError } = await supabase.from("clients").insert({
    contact_id: contact.id,
    company_name: application.company_name,
  });

  if (clientError) {
    if (clientError.code === "23505") {
      return { error: "This person is already a client." };
    }
    return { error: clientError.message };
  }

  const { error: updateError } = await supabase
    .from("client_applications")
    .update({ status: "converted" })
    .eq("id", applicationId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/portal/admin/clients");
  return null;
}

export async function declineApplication(applicationId: string): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("client_applications")
    .update({ status: "declined" })
    .eq("id", applicationId);
  if (error) return { error: error.message };

  revalidatePath("/portal/admin/clients");
  return null;
}
