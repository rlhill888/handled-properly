"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | null;

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

async function uploadSiteImage(
  file: File,
  prefix: string
): Promise<{ path: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };

  const path = `${prefix}/${crypto.randomUUID()}-${sanitizeStorageFilename(file.name)}`;
  const { error } = await createAdminClient()
    .storage.from("site-images")
    .upload(path, file, { contentType: file.type || undefined });

  if (error) return { error: error.message };
  return { path };
}

function revalidateAboutPage() {
  revalidatePath("/portal/admin/website/about");
  revalidatePath("/about");
}

// --- About page fields (singleton row) ---

// One entry per image field on the singleton row: the FormData field name
// for the uploaded file, the "remove current image" checkbox name, the
// database column, and the storage path prefix uploads go under. Looping
// over this (rather than six copies of the same upload/remove logic) is
// what keeps updateAboutPage below from being six near-identical blocks.
const IMAGE_FIELDS = [
  { file: "hero_image", remove: "remove_hero_image", column: "hero_image_path", prefix: "about-page/hero" },
  { file: "story_image", remove: "remove_story_image", column: "story_image_path", prefix: "about-page/story" },
  {
    file: "who_we_are_image",
    remove: "remove_who_we_are_image",
    column: "who_we_are_image_path",
    prefix: "about-page/who-we-are",
  },
  {
    file: "what_we_do_image",
    remove: "remove_what_we_do_image",
    column: "what_we_do_image_path",
    prefix: "about-page/what-we-do",
  },
  { file: "mission_image", remove: "remove_mission_image", column: "mission_image_path", prefix: "about-page/mission" },
  { file: "vision_image", remove: "remove_vision_image", column: "vision_image_path", prefix: "about-page/vision" },
  { file: "values_image", remove: "remove_values_image", column: "values_image_path", prefix: "about-page/values" },
] as const;

export async function updateAboutPage(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const textFields = {
    headline: String(formData.get("headline") ?? "").trim(),
    hero_intro: String(formData.get("hero_intro") ?? "").trim(),
    hero_tagline: String(formData.get("hero_tagline") ?? "").trim(),
    story_body: String(formData.get("story_body") ?? "").trim(),
    who_we_are_body: String(formData.get("who_we_are_body") ?? "").trim(),
    what_we_do_body: String(formData.get("what_we_do_body") ?? "").trim(),
    mission_body: String(formData.get("mission_body") ?? "").trim(),
    vision_body: String(formData.get("vision_body") ?? "").trim(),
    cta_heading: String(formData.get("cta_heading") ?? "").trim(),
    cta_button_text: String(formData.get("cta_button_text") ?? "").trim(),
  };

  const supabase = await createSupabaseServerClient();
  // A literal select list, not IMAGE_FIELDS.map(...).join(", ") -- Supabase's
  // generated types can only infer the returned row shape from a select
  // list they can read at compile time (see the equivalent comment on
  // getAboutPage in site-content.ts).
  const { data: existing } = await supabase
    .from("site_about_page")
    .select(
      "hero_image_path, story_image_path, who_we_are_image_path, what_we_do_image_path, mission_image_path, vision_image_path, values_image_path"
    )
    .eq("id", 1)
    .maybeSingle();

  const imageUpdate: Record<string, string | null> = {};
  const toRemove: string[] = [];

  for (const field of IMAGE_FIELDS) {
    const currentPath = existing?.[field.column] ?? null;
    let nextPath = currentPath;

    const file = formData.get(field.file);
    if (file instanceof File && file.size > 0) {
      const uploaded = await uploadSiteImage(file, field.prefix);
      if ("error" in uploaded) return { error: uploaded.error };
      nextPath = uploaded.path;
    } else if (formData.get(field.remove) === "on") {
      nextPath = null;
    }

    imageUpdate[field.column] = nextPath;
    if (currentPath && currentPath !== nextPath) toRemove.push(currentPath);
  }

  const { error } = await supabase
    .from("site_about_page")
    .update({ ...textFields, ...imageUpdate, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: error.message };

  if (toRemove.length > 0) {
    await createAdminClient().storage.from("site-images").remove(toRemove);
  }

  revalidateAboutPage();
  return null;
}

// --- Values ---

export async function createValue(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase.from("site_about_values").select("id", { count: "exact", head: true });

  const { error } = await supabase
    .from("site_about_values")
    .insert({ title, description, sort_order: count ?? 0 });

  if (error) return { error: error.message };

  revalidateAboutPage();
  return null;
}

export async function updateValue(
  itemId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_about_values").update({ title, description }).eq("id", itemId);

  if (error) return { error: error.message };

  revalidateAboutPage();
  return null;
}

export async function deleteValue(itemId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_about_values").delete().eq("id", itemId);
  if (error) return { error: error.message };

  revalidateAboutPage();
  return {};
}

export async function moveValue(itemId: string, direction: "up" | "down"): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("site_about_values")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (!rows) return {};

  const index = rows.findIndex((row) => row.id === itemId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return {};

  const a = rows[index];
  const b = rows[swapWith];

  await Promise.all([
    supabase.from("site_about_values").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabase.from("site_about_values").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  revalidateAboutPage();
  return {};
}
