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

// About Page Content: the singleton row's fixed fields (headshot + about
// text) -- see docs/adr/0032-about-page-editable-landing-page.md. Distinct
// from Social Link and Featured Item, which are their own tables below.
export type AboutPageContent = { headshotUrl: string | null; aboutBody: string };

export async function getAboutPageContent(): Promise<AboutPageContent> {
  const { data } = await createAdminClient()
    .from("site_about_content")
    .select("headshot_path, about_body")
    .eq("id", 1)
    .maybeSingle();

  return {
    headshotUrl: publicImageUrl(data?.headshot_path ?? null),
    aboutBody: data?.about_body ?? "",
  };
}

export type SocialLink = { id: string; iconUrl: string; url: string };

export async function getSocialLinks(): Promise<SocialLink[]> {
  const { data } = await createAdminClient()
    .from("site_social_links")
    .select("id, icon_path, url")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    iconUrl: publicImageUrl(row.icon_path) ?? "",
    url: row.url,
  }));
}

export type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string | null;
};

export async function getFeaturedItems(): Promise<FeaturedItem[]> {
  const { data } = await createAdminClient()
    .from("site_featured_items")
    .select("id, title, description, image_path, link_url")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: publicImageUrl(row.image_path),
    linkUrl: row.link_url,
  }));
}

// About Page: the bespoke, hand-coded /about marketing page's own fixed
// fields -- seven named sections (Hero/Introduction, Our Story, Who We
// Are, What We Do, Our Mission, Our Vision, Our Values) plus a closing
// CTA, each with its own text and (except Values, which gets one
// section-level image alongside its list of cards below) exactly one
// admin-editable image. See docs/adr/0031-about-page-hand-coded-not-
// block-driven.md, docs/adr/0034-about-page-editable-fields-not-
// blocks.md, and docs/adr/0035-about-page-seven-sections.md. A completely
// different page/table from AboutPageContent above, which belongs to the
// separate /about-and-connect bio-link page. Every image URL comes back
// null when the admin hasn't uploaded one yet; the page falls back to its
// own bundled default images in that case.
export type AboutPage = {
  headline: string;
  heroIntro: string;
  heroTagline: string;
  heroImageUrl: string | null;
  storyBody: string;
  storyImageUrl: string | null;
  whoWeAreBody: string;
  whoWeAreImageUrl: string | null;
  whatWeDoBody: string;
  whatWeDoImageUrl: string | null;
  missionBody: string;
  missionImageUrl: string | null;
  visionBody: string;
  visionImageUrl: string | null;
  valuesImageUrl: string | null;
  ctaHeading: string;
  ctaButtonText: string;
};

export async function getAboutPage(): Promise<AboutPage> {
  const { data } = await createAdminClient()
    .from("site_about_page")
    // A literal string, not a variable built with .join(", ") -- Supabase's
    // generated types can only infer the returned row shape from a select
    // list they can read at compile time.
    .select(
      "headline, hero_intro, hero_tagline, hero_image_path, story_body, story_image_path, who_we_are_body, who_we_are_image_path, what_we_do_body, what_we_do_image_path, mission_body, mission_image_path, vision_body, vision_image_path, values_image_path, cta_heading, cta_button_text"
    )
    .eq("id", 1)
    .maybeSingle();

  return {
    headline: data?.headline ?? "",
    heroIntro: data?.hero_intro ?? "",
    heroTagline: data?.hero_tagline ?? "",
    heroImageUrl: publicImageUrl(data?.hero_image_path ?? null),
    storyBody: data?.story_body ?? "",
    storyImageUrl: publicImageUrl(data?.story_image_path ?? null),
    whoWeAreBody: data?.who_we_are_body ?? "",
    whoWeAreImageUrl: publicImageUrl(data?.who_we_are_image_path ?? null),
    whatWeDoBody: data?.what_we_do_body ?? "",
    whatWeDoImageUrl: publicImageUrl(data?.what_we_do_image_path ?? null),
    missionBody: data?.mission_body ?? "",
    missionImageUrl: publicImageUrl(data?.mission_image_path ?? null),
    visionBody: data?.vision_body ?? "",
    visionImageUrl: publicImageUrl(data?.vision_image_path ?? null),
    valuesImageUrl: publicImageUrl(data?.values_image_path ?? null),
    ctaHeading: data?.cta_heading ?? "",
    ctaButtonText: data?.cta_button_text ?? "",
  };
}

// Our Values: one "value" card (title + short description) in the Values
// section's grid -- renamed from "Differentiator" now that /about has a
// dedicated Values section rather than a standalone "what makes us
// different" grid (docs/adr/0035-about-page-seven-sections.md).
// Admin-managed count (add/edit/remove/reorder), like Social Link and
// Featured Item.
export type AboutValue = { id: string; title: string; description: string };

export async function getAboutValues(): Promise<AboutValue[]> {
  const { data } = await createAdminClient()
    .from("site_about_values")
    .select("id, title, description")
    .order("sort_order", { ascending: true });

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
  }));
}
