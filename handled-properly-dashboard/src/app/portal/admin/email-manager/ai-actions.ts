"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { generateEmailHtml } from "@/lib/ai-email-html";

export async function generateEmailHtmlWithAI(
  designBrief: string,
  contentDetails: string,
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

  try {
    const bodyHtml = await generateEmailHtml(designBrief, contentDetails, context, currentHtml);
    return { bodyHtml };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI generation failed. Try again." };
  }
}
