import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { BlocksSchema, allImagePaths, type Block } from "@/lib/blocks";

// Public marketing-site reads go through the service-role client, same as
// client_applications writes in get-started/actions.ts — anon has no table
// grants in this schema (see the initial-schema migration's RLS comment),
// so there's no per-session client that could read these rows for a
// signed-out visitor.

function publicImageUrl(path: string | null): string | null {
  if (!path) return null;
  return createAdminClient().storage.from("site-images").getPublicUrl(path).data.publicUrl;
}

// Parses raw jsonb into typed Blocks, defensively falling back to an empty
// stack rather than throwing if a row somehow holds something the schema
// doesn't recognize (writes are always validated -- see parseBlocks in
// blocks-sanitize.ts -- so this is just a guard against a manual DB edit or
// future migration mistake, not an expected path).
function parseStoredBlocks(raw: unknown): Block[] {
  const result = BlocksSchema.safeParse(raw);
  return result.success ? result.data : [];
}

// One resolved public URL per distinct image path referenced anywhere in
// the block stack -- BlockRenderer looks these up by path rather than each
// block carrying its own pre-resolved URL, so the Block type stays exactly
// what's stored in the database.
function resolveBlockImageUrls(blocks: Block[]): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const path of allImagePaths(blocks)) {
    const url = publicImageUrl(path);
    if (url) urls[path] = url;
  }
  return urls;
}

export type TrustedPartner = {
  id: string;
  name: string;
  logoUrl: string | null;
};

export async function getTrustedPartners(): Promise<TrustedPartner[]> {
  const { data } = await createAdminClient()
    .from("site_trusted_partners")
    .select("id, name, logo_path")
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    logoUrl: publicImageUrl(row.logo_path),
  }));
}

export type BlogPostSummary = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  eventDate: string | null;
  excerpt: string | null;
  coverImageUrl: string | null;
  isFeatured: boolean;
};

export type BlogPost = BlogPostSummary & { blocks: Block[]; imageUrls: Record<string, string> };

const SUMMARY_COLUMNS = "id, title, slug, category, event_date, excerpt, cover_image_path, is_featured";

function toSummary(row: {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  event_date: string | null;
  excerpt: string | null;
  cover_image_path: string | null;
  is_featured: boolean;
}): BlogPostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: row.category,
    eventDate: row.event_date,
    excerpt: row.excerpt,
    coverImageUrl: publicImageUrl(row.cover_image_path),
    isFeatured: row.is_featured,
  };
}

export async function getFeaturedBlogPosts(limit: number): Promise<BlogPostSummary[]> {
  const { data } = await createAdminClient()
    .from("site_blog_posts")
    .select(SUMMARY_COLUMNS)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map(toSummary);
}

export async function getAllBlogPosts(): Promise<BlogPostSummary[]> {
  const { data } = await createAdminClient()
    .from("site_blog_posts")
    .select(SUMMARY_COLUMNS)
    .order("created_at", { ascending: false });

  return (data ?? []).map(toSummary);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const { data } = await createAdminClient()
    .from("site_blog_posts")
    .select(`${SUMMARY_COLUMNS}, blocks`)
    .eq("slug", slug)
    .maybeSingle();

  if (!data) return null;
  const blocks = parseStoredBlocks(data.blocks);
  return { ...toSummary(data), blocks, imageUrls: resolveBlockImageUrls(blocks) };
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  const { data } = await createAdminClient()
    .from("site_blog_posts")
    .select(`${SUMMARY_COLUMNS}, blocks`)
    .eq("id", id)
    .maybeSingle();

  if (!data) return null;
  const blocks = parseStoredBlocks(data.blocks);
  return { ...toSummary(data), blocks, imageUrls: resolveBlockImageUrls(blocks) };
}

export type AboutContent = { blocks: Block[]; imageUrls: Record<string, string> };

export async function getAboutContent(): Promise<AboutContent> {
  const { data } = await createAdminClient()
    .from("site_about_content")
    .select("blocks")
    .eq("id", 1)
    .maybeSingle();

  const blocks = parseStoredBlocks(data?.blocks);
  return { blocks, imageUrls: resolveBlockImageUrls(blocks) };
}
