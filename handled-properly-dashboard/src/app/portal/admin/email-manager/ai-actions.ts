"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { generateEmailDraft } from "@/lib/ai-email-draft";

export async function draftEmailWithAI(
  prompt: string
): Promise<{ subject: string; bodyHtml: string } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (!prompt.trim()) return { error: "Describe the email you want first." };

  try {
    return await generateEmailDraft(prompt);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI drafting failed. Try again." };
  }
}
