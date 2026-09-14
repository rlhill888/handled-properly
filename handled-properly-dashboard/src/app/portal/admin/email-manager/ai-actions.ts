"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import {
  suggestButtonMapping,
  applyButtonMapping,
  type ButtonCandidateOption,
  type FormSuggestion,
  type ButtonMappingResult,
} from "@/lib/ai-email-button-mapping";

export async function suggestButtonMappingAction(
  bodyHtml: string,
  forms: { id: string; name: string }[]
): Promise<{ candidates: ButtonCandidateOption[]; suggestions: FormSuggestion[] } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (!bodyHtml.trim()) return { error: "Write or upload the email body first." };
  if (forms.length === 0) return { error: "Attach at least one form first." };

  try {
    return await suggestButtonMapping(bodyHtml, forms);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Button mapping failed. Try again." };
  }
}

export async function applyButtonMappingAction(
  bodyHtml: string,
  mapping: FormSuggestion[]
): Promise<{ bodyHtml: string; results: ButtonMappingResult[] } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  return applyButtonMapping(bodyHtml, mapping);
}
