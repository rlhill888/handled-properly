"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | null;

// file_path is not-null, so unlike submitForm's "insert then upload keyed by
// the new row's id" ordering, we generate the id ourselves up front, upload
// first, then insert the row already carrying its final file_path — no
// intermediate row with an empty/placeholder path.
export async function uploadDocumentation(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const file = formData.get("file");

  if (!title) return { error: "Title is required." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  const id = crypto.randomUUID();
  const adminClient = createAdminClient();
  const path = `${id}/${Date.now()}-${sanitizeStorageFilename(file.name)}`;
  const { error: uploadError } = await adminClient.storage
    .from("documentation-files")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { error: uploadError.message };

  const supabase = await createSupabaseServerClient();
  const { error: insertError } = await supabase
    .from("documentation")
    .insert({ id, event_id: eventId, title, description: description || null, file_path: path });
  if (insertError) return { error: insertError.message };

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return null;
}

export async function deleteDocumentation(
  documentationId: string,
  eventId: string
): Promise<{ error?: string }> {
  const actor = await getCurrentActor();
  if (actor?.role !== "admin") return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: doc } = await supabase
    .from("documentation")
    .select("file_path")
    .eq("id", documentationId)
    .maybeSingle();

  const { error } = await supabase.from("documentation").delete().eq("id", documentationId);
  if (error) return { error: error.message };

  if (doc?.file_path) {
    await createAdminClient().storage.from("documentation-files").remove([doc.file_path]);
  }

  revalidatePath(`/portal/admin/event-tracker/${eventId}`);
  return {};
}
