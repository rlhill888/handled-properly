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

function revalidateAbout() {
  revalidatePath("/portal/admin/website/about-and-connect");
  revalidatePath("/about-and-connect");
}

// --- About text + headshot (singleton row) ---

export async function updateAboutPageContent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const aboutBody = String(formData.get("about_body") ?? "").trim();
  const removeHeadshot = formData.get("remove_headshot") === "on";
  const file = formData.get("headshot");

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_about_content")
    .select("headshot_path")
    .eq("id", 1)
    .maybeSingle();

  let headshotPath = existing?.headshot_path ?? null;

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadSiteImage(file, "about/headshot");
    if ("error" in uploaded) return { error: uploaded.error };
    headshotPath = uploaded.path;
  } else if (removeHeadshot) {
    headshotPath = null;
  }

  const { error } = await supabase
    .from("site_about_content")
    .update({ about_body: aboutBody, headshot_path: headshotPath, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return { error: error.message };

  if (existing?.headshot_path && existing.headshot_path !== headshotPath) {
    await createAdminClient().storage.from("site-images").remove([existing.headshot_path]);
  }

  revalidateAbout();
  return null;
}

// --- Social Links ---

export async function createSocialLink(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Link is required." };

  const file = formData.get("icon");
  if (!(file instanceof File) || file.size === 0) return { error: "Icon is required." };

  const uploaded = await uploadSiteImage(file, "social-links");
  if ("error" in uploaded) return { error: uploaded.error };

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("site_social_links")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase
    .from("site_social_links")
    .insert({ icon_path: uploaded.path, url, sort_order: count ?? 0 });

  if (error) {
    await createAdminClient().storage.from("site-images").remove([uploaded.path]);
    return { error: error.message };
  }

  revalidateAbout();
  return null;
}

export async function updateSocialLink(
  linkId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const url = String(formData.get("url") ?? "").trim();
  if (!url) return { error: "Link is required." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_social_links")
    .select("icon_path")
    .eq("id", linkId)
    .maybeSingle();
  if (!existing) return { error: "Social link not found." };

  let iconPath = existing.icon_path;
  const file = formData.get("icon");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadSiteImage(file, "social-links");
    if ("error" in uploaded) return { error: uploaded.error };
    iconPath = uploaded.path;
  }

  const { error } = await supabase
    .from("site_social_links")
    .update({ url, icon_path: iconPath })
    .eq("id", linkId);

  if (error) return { error: error.message };

  if (existing.icon_path !== iconPath) {
    await createAdminClient().storage.from("site-images").remove([existing.icon_path]);
  }

  revalidateAbout();
  return null;
}

export async function deleteSocialLink(linkId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_social_links")
    .select("icon_path")
    .eq("id", linkId)
    .maybeSingle();

  const { error } = await supabase.from("site_social_links").delete().eq("id", linkId);
  if (error) return { error: error.message };

  if (existing?.icon_path) {
    await createAdminClient().storage.from("site-images").remove([existing.icon_path]);
  }

  revalidateAbout();
  return {};
}

export async function moveSocialLink(linkId: string, direction: "up" | "down"): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("site_social_links")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (!rows) return {};

  const index = rows.findIndex((row) => row.id === linkId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return {};

  const a = rows[index];
  const b = rows[swapWith];

  await Promise.all([
    supabase.from("site_social_links").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabase.from("site_social_links").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  revalidateAbout();
  return {};
}

// --- Featured Items ---

export async function createFeaturedItem(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim() || null;

  let imagePath: string | null = null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadSiteImage(file, "featured-items");
    if ("error" in uploaded) return { error: uploaded.error };
    imagePath = uploaded.path;
  }

  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("site_featured_items")
    .select("id", { count: "exact", head: true });

  const { error } = await supabase
    .from("site_featured_items")
    .insert({ title, description, link_url: linkUrl, image_path: imagePath, sort_order: count ?? 0 });

  if (error) {
    if (imagePath) await createAdminClient().storage.from("site-images").remove([imagePath]);
    return { error: error.message };
  }

  revalidateAbout();
  return null;
}

export async function updateFeaturedItem(
  itemId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Title is required." };
  const description = String(formData.get("description") ?? "").trim();
  const linkUrl = String(formData.get("link_url") ?? "").trim() || null;
  const removeImage = formData.get("remove_image") === "on";

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_featured_items")
    .select("image_path")
    .eq("id", itemId)
    .maybeSingle();
  if (!existing) return { error: "Item not found." };

  let imagePath = existing.image_path;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadSiteImage(file, "featured-items");
    if ("error" in uploaded) return { error: uploaded.error };
    imagePath = uploaded.path;
  } else if (removeImage) {
    imagePath = null;
  }

  const { error } = await supabase
    .from("site_featured_items")
    .update({ title, description, link_url: linkUrl, image_path: imagePath })
    .eq("id", itemId);

  if (error) return { error: error.message };

  if (existing.image_path && existing.image_path !== imagePath) {
    await createAdminClient().storage.from("site-images").remove([existing.image_path]);
  }

  revalidateAbout();
  return null;
}

export async function deleteFeaturedItem(itemId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_featured_items")
    .select("image_path")
    .eq("id", itemId)
    .maybeSingle();

  const { error } = await supabase.from("site_featured_items").delete().eq("id", itemId);
  if (error) return { error: error.message };

  if (existing?.image_path) {
    await createAdminClient().storage.from("site-images").remove([existing.image_path]);
  }

  revalidateAbout();
  return {};
}

export async function moveFeaturedItem(itemId: string, direction: "up" | "down"): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("site_featured_items")
    .select("id, sort_order")
    .order("sort_order", { ascending: true });
  if (!rows) return {};

  const index = rows.findIndex((row) => row.id === itemId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= rows.length) return {};

  const a = rows[index];
  const b = rows[swapWith];

  await Promise.all([
    supabase.from("site_featured_items").update({ sort_order: b.sort_order }).eq("id", a.id),
    supabase.from("site_featured_items").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);

  revalidateAbout();
  return {};
}
