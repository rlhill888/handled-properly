import "server-only";
import sanitizeHtml from "sanitize-html";
import { BlocksSchema, type Block } from "@/lib/blocks";

// Split out of blocks.ts (and marked server-only) so that BlockEditor.tsx
// -- a Client Component that needs Block/createEmptyBlock -- never pulls
// the Node-only sanitize-html package into the browser bundle.

// image_text's RichTextEditor exposes bold + italic only (no headings, no
// highlight -- see docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md).
// Everything else (scripts, event handler attributes, iframes, arbitrary
// tags) is stripped. Applied server-side before its html is ever written
// to the database, so what's stored is already safe -- rendering never
// needs to re-sanitize. See docs/adr/0019-sanitize-block-html-server-side.md.
export function sanitizeBlockHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["b", "strong", "i", "em", "p", "br"],
  });
}

// Paragraph's RichTextEditor only exposes italic (see
// docs/adr/0023-title-and-paragraph-replace-text.md and
// docs/adr/0024-remove-highlight-and-narrow-image-text-toolbar.md) -- its
// allowlist is narrower to match exactly what that toolbar can produce,
// same principle as sanitizeBlockHtml but for a smaller toolbar.
export function sanitizeParagraphHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ["i", "em", "p", "br"],
  });
}

// Parses+validates the raw "blocks" form field, sanitizing every
// paragraph/image_text block's html along the way. Title is plain text,
// not HTML, so it needs no sanitizing -- React escapes it as text content
// wherever it's rendered. Returns an error message instead of throwing so
// callers (the Server Actions) can return it as a normal ActionState error.
export function parseBlocks(raw: string): { blocks: Block[] } | { error: string } {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { error: "Could not read the page content — try refreshing and re-editing." };
  }

  const result = BlocksSchema.safeParse(json);
  if (!result.success) {
    return { error: "Could not read the page content — try refreshing and re-editing." };
  }

  const blocks = result.data.map((block): Block => {
    if (block.type === "paragraph") return { ...block, html: sanitizeParagraphHtml(block.html) };
    if (block.type === "image_text") return { ...block, html: sanitizeBlockHtml(block.html) };
    return block;
  });

  return { blocks };
}
