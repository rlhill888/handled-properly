"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSupabaseServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentActor } from "@/lib/auth/get-current-actor";
import { sanitizeStorageFilename } from "@/lib/storage-filename";

export type ActionState = { error: string } | null;

// The one Client-writable path in the whole Client Portal. requests has no
// client UPDATE RLS policy by design — the write happens here, via the
// service-role client, mirroring submitForm's anonymous-write pattern.
export async function uploadRequestFile(
  requestId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const actor = await getCurrentActor();
  if (actor?.role !== "client") return { error: "Not authorized." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  const supabase = await createSupabaseServerClient();
  // RLS (client_select_own_requests) both authorizes and 404s a request_id
  // for someone else's event in this one query.
  const { data: request } = await supabase
    .from("requests")
    .select("id, event_id, requires_file, fulfillment_setting, file_path")
    .eq("id", requestId)
    .maybeSingle();
  if (!request) return { error: "Request not found." };
  if (!request.requires_file) return { error: "This request doesn't accept a file upload." };

  const adminClient = createAdminClient();
  const path = `${requestId}/${Date.now()}-${sanitizeStorageFilename(file.name)}`;
  const { error: uploadError } = await adminClient.storage
    .from("request-attachments")
    .upload(path, file, { contentType: file.type || undefined });
  if (uploadError) return { error: uploadError.message };

  const update: { file_path: string; fulfilled_at?: string } = { file_path: path };
  if (request.fulfillment_setting === "auto") {
    update.fulfilled_at = new Date().toISOString();
  }

  const { error: updateError } = await adminClient.from("requests").update(update).eq("id", requestId);
  if (updateError) return { error: updateError.message };

  const oldPath = request.file_path;
  if (oldPath) {
    await adminClient.storage.from("request-attachments").remove([oldPath]);
  }

  revalidatePath(`/portal/client/events/${request.event_id}/requests/${requestId}`);
  revalidatePath(`/portal/client/events/${request.event_id}`);
  return null;
}
