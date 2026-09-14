"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { findBannerImageUrl, generateFormDesign, type AiFormDesign } from "@/lib/ai-form-design";
import type { FormBuilderSaveData } from "@/components/FormBuilder";

export async function generateFormWithAI(
  prompt: string,
  currentDesign: FormBuilderSaveData | null,
): Promise<AiFormDesign | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };
  if (!prompt.trim()) return { error: "Describe the form you want first." };

  try {
    const bannerImageUrl = await findBannerImageUrl(prompt);
    const design = await generateFormDesign(prompt, bannerImageUrl !== null, currentDesign);
    if (design.theme.wantsBannerImage && bannerImageUrl) {
      design.theme.backgroundImage = bannerImageUrl;
    }
    return design;
  } catch (err) {
    console.error("generateFormWithAI failed:", err);
    return { error: "An error occurred. Please try again." };
  }
}
