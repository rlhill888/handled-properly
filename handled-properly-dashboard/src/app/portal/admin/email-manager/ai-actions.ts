"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { generateEmailHtml } from "@/lib/ai-email-html";

export async function generateEmailHtmlWithAI(
  designBrief: string,
  bodyContent: string,
  context: { subject?: string; formName?: string | null; photoCount: number },
  currentHtml?: string | null,
): Promise<{ bodyHtml: string } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (!designBrief.trim()) {
    return {
      error: currentHtml
        ? "Describe what you'd like to change first."
        : "Describe what the email should look like first.",
    };
  }
  // Only required on a fresh generation — a revision re-styles the existing
  // HTML (which already has the content spliced in via currentHtml/context),
  // it doesn't need the body re-supplied.
  if (!currentHtml && !bodyContent.trim()) {
    return { error: "Write your email body first." };
  }

  try {
    const bodyHtml = await generateEmailHtml(designBrief, bodyContent, context, currentHtml);
    return { bodyHtml };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed. Try again." };
  }
}
