"use server";

import { getCurrentActor } from "@/lib/auth/get-current-actor";
import {
  findBannerImageUrl,
  generateFormDesign,
  reviewFormScreenshot,
  type AiFormDesign,
  type AiReviewResult,
} from "@/lib/ai-form-design";
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
    return { error: err instanceof Error ? err.message : "AI design failed. Try again." };
  }
}

export async function reviewFormScreenshotAction(
  prompt: string,
  screenshotBase64: string,
  currentDesign: AiFormDesign,
): Promise<AiReviewResult | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  try {
    return await reviewFormScreenshot(prompt, screenshotBase64, currentDesign);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "AI review failed. Try again." };
  }
}
