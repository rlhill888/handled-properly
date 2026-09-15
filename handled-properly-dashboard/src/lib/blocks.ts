import { z } from "zod";

// Content Block: one reusable, admin-stacked section of a page (About, or a
// Blog Post's body) -- see CONTEXT.md. These types cover "image and text
// sections" plus a couple of compound layouts and a plain divider,
// deliberately short of every layout a full page builder could offer (no
// carousel, no more exotic grids) -- see
// docs/adr/0018-four-content-block-types.md.

// Every block controls its own vertical spacing (top/bottom margin, as a
// percentage -- see docs/adr/0027-percentage-based-block-spacing.md for why
// percent rather than pixels, and the caveat that CSS resolves a margin
// percentage against the containing block's WIDTH, not viewport height).
// .section (BlockRenderer.module.css) has no gap of its own specifically so
// per-block margins are the only thing controlling the space between
// sections, rather than fighting a flex gap on top of them.
export type Spacing = { marginTop: number; marginBottom: number };
const SpacingSchema = { marginTop: z.number().default(2), marginBottom: z.number().default(2) };
export const DEFAULT_SPACING: Spacing = { marginTop: 2, marginBottom: 2 };

// Title is plain text (no formatting at all -- it's a heading, not prose)
// and Paragraph is rich text limited to italic + highlight (no bold, no
// headings -- there's nothing to switch a paragraph's own block-level tag
// to). Splitting the old, one-size-fits-all "Text" block (bold/italic/
// highlight/H2/H3/paragraph, all in one type) into these two dedicated
// types is a simplification, not new capability -- see
// docs/adr/0023-title-and-paragraph-replace-text.md.
//
// mutedText/supportingText are both optional and both default to null --
// a bare Title (just `text`) renders exactly as before. mutedText adds a
// second, muted-gray line after the main (dark) text -- the two-tone
// stacked headline look ("BIG MOMENTS. SMALL DETAILS." dark, "ALL
// HANDLED." muted). supportingText, when set, moves the heading into a
// two-column layout with a short paragraph beside it and a thin divider
// between them, rather than adding a seventh block type for what is
// structurally still "a heading" -- see
// docs/adr/0030-heading-and-features-and-cta-blocks.md.
export type TitleBlock = {
  id: string;
  type: "title";
  text: string;
  mutedText: string | null;
  supportingText: string | null;
} & Spacing;
export type ParagraphBlock = { id: string; type: "paragraph"; html: string } & Spacing;
export type ImageBlock = {
  id: string;
  type: "image";
  imagePath: string;
  caption: string | null;
  // Matches the desaturated, editorial photo treatment in the reference
  // design -- a per-image toggle rather than a site-wide setting, since
  // not every image should be forced into it.
  grayscale: boolean;
} & Spacing;
export type ImageTextBlock = {
  id: string;
  type: "image_text";
  imagePath: string | null;
  html: string;
  imagePosition: "left" | "right";
  dark: boolean;
  // null = natural aspect ratio (the image's own height), matching the
  // original behavior. A number crops the image to exactly that height
  // (object-fit: cover) -- lets the admin control how tall the section
  // reads regardless of what image gets uploaded there.
  mediaHeight: number | null;
} & Spacing;
export type GalleryItem = { imagePath: string; title: string | null; caption: string | null };
// "grid" (default) is the static responsive grid ADR-0018 chose over a
// carousel; "carousel" opts a specific Gallery into the interactive
// arrows-and-dots version instead -- see docs/adr/0021-gallery-carousel-option.md.
export type GalleryDisplayMode = "grid" | "carousel";
export type GalleryBlock = {
  id: string;
  type: "gallery";
  items: GalleryItem[];
  displayMode: GalleryDisplayMode;
  // Only meaningful when displayMode is "carousel" -- auto-advance is
  // always pausable and always navigable by hand regardless of this
  // setting (WCAG 2.2.2 -- content that moves on its own needs a way to
  // stop it), see docs/adr/0022-carousel-autoplay.md.
  autoplay: boolean;
} & Spacing;
// A plain horizontal rule the admin inserts between other blocks to break
// up the page -- no fields of its own beyond spacing, unlike every other
// block type.
export type DividerBlock = { id: string; type: "divider" } & Spacing;

// A numbered list of short title+description items in a responsive grid
// (the "01 Clarity at every step / 02 Everyone in sync / 03 Details that
// matter" pattern) -- see docs/adr/0030-heading-and-features-and-cta-blocks.md.
// Numbers are derived from each item's position when rendered, not stored,
// so reordering items (or the whole block moving) never needs a
// renumbering step.
export type FeatureItem = { title: string; description: string };
export type FeaturesBlock = { id: string; type: "features"; items: FeatureItem[] } & Spacing;

// A full-width statement banner with a heading and one call-to-action
// button/link -- the "YOUR NEXT EVENT. HANDLED PROPERLY." dark closing
// banner. Distinct from image_text's `dark` option because it has no
// image at all and, uniquely among block types, a link -- forcing it into
// image_text would mean an "image_text" block that can never have an
// image, which misdescribes what it is.
export type CtaBlock = {
  id: string;
  type: "cta";
  heading: string;
  buttonText: string;
  buttonHref: string;
  dark: boolean;
} & Spacing;

export type Block =
  | TitleBlock
  | ParagraphBlock
  | ImageBlock
  | ImageTextBlock
  | GalleryBlock
  | DividerBlock
  | FeaturesBlock
  | CtaBlock;

const TitleBlockSchema = z.object({
  id: z.string(),
  type: z.literal("title"),
  text: z.string(),
  mutedText: z.string().nullable().default(null),
  supportingText: z.string().nullable().default(null),
  ...SpacingSchema,
});

const ParagraphBlockSchema = z.object({
  id: z.string(),
  type: z.literal("paragraph"),
  html: z.string(),
  ...SpacingSchema,
});

const ImageBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image"),
  imagePath: z.string(),
  caption: z.string().nullable(),
  grayscale: z.boolean().default(false),
  ...SpacingSchema,
});

const ImageTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal("image_text"),
  imagePath: z.string().nullable(),
  html: z.string(),
  imagePosition: z.enum(["left", "right"]),
  dark: z.boolean(),
  mediaHeight: z.number().nullable().default(null),
  ...SpacingSchema,
});

const GalleryItemSchema = z.object({
  imagePath: z.string(),
  title: z.string().nullable(),
  caption: z.string().nullable(),
});

const GalleryBlockSchema = z.object({
  id: z.string(),
  type: z.literal("gallery"),
  items: z.array(GalleryItemSchema),
  displayMode: z.enum(["grid", "carousel"]).default("grid"),
  autoplay: z.boolean().default(false),
  ...SpacingSchema,
});

const DividerBlockSchema = z.object({
  id: z.string(),
  type: z.literal("divider"),
  ...SpacingSchema,
});

const FeatureItemSchema = z.object({
  title: z.string(),
  description: z.string(),
});

const FeaturesBlockSchema = z.object({
  id: z.string(),
  type: z.literal("features"),
  items: z.array(FeatureItemSchema),
  ...SpacingSchema,
});

const CtaBlockSchema = z.object({
  id: z.string(),
  type: z.literal("cta"),
  heading: z.string(),
  buttonText: z.string(),
  buttonHref: z.string(),
  dark: z.boolean().default(true),
  ...SpacingSchema,
});

export const BlockSchema = z.discriminatedUnion("type", [
  TitleBlockSchema,
  ParagraphBlockSchema,
  ImageBlockSchema,
  ImageTextBlockSchema,
  GalleryBlockSchema,
  DividerBlockSchema,
  FeaturesBlockSchema,
  CtaBlockSchema,
]);

export const BlocksSchema = z.array(BlockSchema);

// getPublicUrl's well-known path shape for a public bucket -- lets client
// components (BlockEditor's image previews) build a URL from just the path
// an upload action returns, with no Supabase client/session needed.
export function siteImagePublicUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/site-images/${path}`;
}

export function createEmptyBlock(type: Block["type"]): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case "title":
      return {
        id,
        type: "title",
        text: "",
        mutedText: null,
        supportingText: null,
        ...DEFAULT_SPACING,
      };
    case "paragraph":
      return { id, type: "paragraph", html: "", ...DEFAULT_SPACING };
    case "image":
      return { id, type: "image", imagePath: "", caption: null, grayscale: false, ...DEFAULT_SPACING };
    case "image_text":
      return {
        id,
        type: "image_text",
        imagePath: null,
        html: "",
        imagePosition: "left",
        dark: false,
        // A default, not null/natural -- an uncapped image next to a few
        // lines of text leaves a large empty gap under the text (the row
        // has to be as tall as the taller side), which read as broken
        // rather than intentional. 400px keeps the image substantial
        // without letting whatever photo gets uploaded dictate the row's
        // height; still editable/clearable back to natural per block.
        mediaHeight: 400,
        ...DEFAULT_SPACING,
      };
    case "gallery":
      return { id, type: "gallery", items: [], displayMode: "grid", autoplay: false, ...DEFAULT_SPACING };
    case "divider":
      return { id, type: "divider", ...DEFAULT_SPACING };
    case "features":
      return { id, type: "features", items: [], ...DEFAULT_SPACING };
    case "cta":
      return {
        id,
        type: "cta",
        heading: "",
        buttonText: "Start Planning",
        buttonHref: "/get-started",
        dark: true,
        ...DEFAULT_SPACING,
      };
  }
}

function extractImagePaths(blocks: Block[]): Set<string> {
  const paths = new Set<string>();
  for (const block of blocks) {
    if (block.type === "image" && block.imagePath) paths.add(block.imagePath);
    if (block.type === "image_text" && block.imagePath) paths.add(block.imagePath);
    if (block.type === "gallery") {
      for (const item of block.items) if (item.imagePath) paths.add(item.imagePath);
    }
  }
  return paths;
}

// Paths referenced by the old block set but not the new one -- safe to
// remove from storage after the new blocks are saved. Mirrors the
// best-effort cleanup already used for cover images/logos elsewhere in
// this admin section.
export function diffRemovedImagePaths(oldBlocks: Block[], newBlocks: Block[]): string[] {
  const oldPaths = extractImagePaths(oldBlocks);
  const newPaths = extractImagePaths(newBlocks);
  return [...oldPaths].filter((path) => !newPaths.has(path));
}

export function allImagePaths(blocks: Block[]): string[] {
  return [...extractImagePaths(blocks)];
}
