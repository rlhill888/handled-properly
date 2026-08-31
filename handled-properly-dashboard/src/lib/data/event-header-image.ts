import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Used by the Active Events list, where many cards each need a URL — a
// signed URL (never a public bucket URL, matching the form-submissions
// bucket's pattern) lets the browser fetch each image itself, in parallel,
// rather than the server embedding every one inline. A 1 hour TTL is plenty
// since it's only ever used as that page render's <img src>.
export async function getEventHeaderImageUrl(headerImagePath: string | null): Promise<string | null> {
  if (!headerImagePath) return null;
  const { data } = await createAdminClient()
    .storage.from("event-header-images")
    .createSignedUrl(headerImagePath, 60 * 60);
  return data?.signedUrl ?? null;
}

// Used by the single-event detail pages (admin + staff): fetches the image
// bytes server-side and returns them as a data: URI embedded directly in
// the page's HTML/RSC payload, instead of a signed URL the browser would
// fetch as a separate request after the page renders. That second request
// is what causes the header image to visibly pop in a beat after the rest
// of the page — embedding the bytes means the image ships with the page and
// is already there the instant it renders. Worth the payload-size tradeoff
// for one image on a single-event page; not used on the list, where it
// would multiply that cost per card.
export async function getEventHeaderImageDataUrl(headerImagePath: string | null): Promise<string | null> {
  if (!headerImagePath) return null;
  const { data, error } = await createAdminClient()
    .storage.from("event-header-images")
    .download(headerImagePath);
  if (error || !data) return null;

  const buffer = Buffer.from(await data.arrayBuffer());
  const contentType = data.type || "image/jpeg";
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}
