"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { parseBlocks } from "@/lib/blocks-sanitize";
import { diffRemovedImagePaths, BlocksSchema } from "@/lib/blocks";

export type ActionState = { error: string } | null;

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

export async function updateAboutContent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const parsed = parseBlocks(String(formData.get("blocks") ?? "[]"));
  if ("error" in parsed) return parsed;

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_about_content")
    .select("blocks")
    .eq("id", 1)
    .maybeSingle();

  const { error } = await supabase
    .from("site_about_content")
    .update({ blocks: parsed.blocks, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: error.message };

  const oldBlocks = BlocksSchema.safeParse(existing?.blocks).data ?? [];
  const removedPaths = diffRemovedImagePaths(oldBlocks, parsed.blocks);
  if (removedPaths.length > 0) {
    await createAdminClient().storage.from("site-images").remove(removedPaths);
  }

  revalidatePath("/portal/admin/website/about");
  revalidatePath("/about");
  return null;
}
