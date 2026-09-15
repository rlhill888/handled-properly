"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

// Shared by every Content Block image field (image/image_text/gallery) --
// unlike a dedicated field's header-image/logo upload (which is bound to a
// single row and mutates it directly), a block's image is just one field
// among many being staged client-side in BlockEditor before one final Save,
// so this only uploads and hands back a path; nothing is written to a
// database row here.
export async function uploadSiteImage(formData: FormData): Promise<{ path: string } | { error: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image to upload." };
  if (!file.type.startsWith("image/")) return { error: "File must be an image." };

  const path = `blocks/${crypto.randomUUID()}-${sanitizeStorageFilename(file.name)}`;
  const { error } = await createAdminClient()
    .storage.from("site-images")
    .upload(path, file, { contentType: file.type || undefined });

  if (error) return { error: error.message };
  return { path };
}
