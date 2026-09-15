"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";
import { slugify } from "@/lib/slugify";
import { parseBlocks } from "@/lib/blocks-sanitize";
import { diffRemovedImagePaths, allImagePaths, BlocksSchema } from "@/lib/blocks";

export type ActionState = { error: string } | null;

async function requireAdmin() {
  const actor = await getCurrentActor();
  return actor?.role === "admin";
}

async function uploadCoverImage(file: File): Promise<{ path: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Cover image must be an image file." };

  const path = `blog-posts/${crypto.randomUUID()}-${sanitizeStorageFilename(file.name)}`;
  const { error } = await createAdminClient()
    .storage.from("site-images")
    .upload(path, file, { contentType: file.type || undefined });

  if (error) return { error: error.message };
  return { path };
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim() || null,
    eventDate: String(formData.get("event_date") ?? "").trim() || null,
    excerpt: String(formData.get("excerpt") ?? "").trim() || null,
    isFeatured: formData.get("is_featured") === "on",
  };
}

export async function createBlogPost(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Title is required." };

  const parsedBlocks = parseBlocks(String(formData.get("blocks") ?? "[]"));
  if ("error" in parsedBlocks) return parsedBlocks;

  let coverImagePath: string | null = null;
  const file = formData.get("cover_image");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadCoverImage(file);
    if ("error" in uploaded) return { error: uploaded.error };
    coverImagePath = uploaded.path;
  }

  const supabase = await createSupabaseServerClient();
  const baseSlug = slugify(fields.title);

  let postId: string | null = null;
  for (let attempt = 0; attempt < 20; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${attempt + 1}`;
    const { data, error } = await supabase
      .from("site_blog_posts")
      .insert({
        title: fields.title,
        slug,
        category: fields.category,
        event_date: fields.eventDate,
        excerpt: fields.excerpt,
        blocks: parsedBlocks.blocks,
        cover_image_path: coverImagePath,
        is_featured: fields.isFeatured,
      })
      .select("id")
      .single();

    if (!error) {
      postId = data.id;
      break;
    }
    if (error.code !== "23505") {
      if (coverImagePath) await createAdminClient().storage.from("site-images").remove([coverImagePath]);
      return { error: error.message };
    }
  }

  if (!postId) {
    if (coverImagePath) await createAdminClient().storage.from("site-images").remove([coverImagePath]);
    return { error: "Could not generate a unique URL slug for this title." };
  }

  revalidatePath("/portal/admin/website/blog");
  revalidatePath("/");
  revalidatePath("/events");
  redirect("/portal/admin/website/blog");
}

export async function updateBlogPost(
  postId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Title is required." };

  const parsedBlocks = parseBlocks(String(formData.get("blocks") ?? "[]"));
  if ("error" in parsedBlocks) return parsedBlocks;

  const removeCoverImage = formData.get("remove_cover_image") === "on";
  const file = formData.get("cover_image");

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_blog_posts")
    .select("cover_image_path, slug, blocks")
    .eq("id", postId)
    .maybeSingle();
  if (!existing) return { error: "Post not found." };

  let coverImagePath = existing.cover_image_path;

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadCoverImage(file);
    if ("error" in uploaded) return { error: uploaded.error };
    coverImagePath = uploaded.path;
  } else if (removeCoverImage) {
    coverImagePath = null;
  }

  const { error } = await supabase
    .from("site_blog_posts")
    .update({
      title: fields.title,
      category: fields.category,
      event_date: fields.eventDate,
      excerpt: fields.excerpt,
      blocks: parsedBlocks.blocks,
      cover_image_path: coverImagePath,
      is_featured: fields.isFeatured,
    })
    .eq("id", postId);

  if (error) return { error: error.message };

  const removedPaths = [...diffRemovedImagePaths(BlocksSchema.safeParse(existing.blocks).data ?? [], parsedBlocks.blocks)];
  if (existing.cover_image_path && existing.cover_image_path !== coverImagePath) {
    removedPaths.push(existing.cover_image_path);
  }
  if (removedPaths.length > 0) {
    await createAdminClient().storage.from("site-images").remove(removedPaths);
  }

  revalidatePath("/portal/admin/website/blog");
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath(`/events/${existing.slug}`);
  redirect("/portal/admin/website/blog");
}

export async function deleteBlogPost(postId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_blog_posts")
    .select("cover_image_path, slug, blocks")
    .eq("id", postId)
    .maybeSingle();

  const { error } = await supabase.from("site_blog_posts").delete().eq("id", postId);
  if (error) return { error: error.message };

  const removedPaths = allImagePaths(BlocksSchema.safeParse(existing?.blocks).data ?? []);
  if (existing?.cover_image_path) removedPaths.push(existing.cover_image_path);
  if (removedPaths.length > 0) {
    await createAdminClient().storage.from("site-images").remove(removedPaths);
  }

  revalidatePath("/portal/admin/website/blog");
  revalidatePath("/");
  revalidatePath("/events");
  if (existing?.slug) revalidatePath(`/events/${existing.slug}`);
  return {};
}
