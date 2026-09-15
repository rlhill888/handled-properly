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

async function uploadLogo(file: File): Promise<{ path: string } | { error: string }> {
  if (!file.type.startsWith("image/")) return { error: "Logo must be an image file." };

  const path = `trusted-partners/${crypto.randomUUID()}-${sanitizeStorageFilename(file.name)}`;
  const { error } = await createAdminClient()
    .storage.from("site-images")
    .upload(path, file, { contentType: file.type || undefined });

  if (error) return { error: error.message };
  return { path };
}

export async function createTrustedPartner(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  let logoPath: string | null = null;
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadLogo(file);
    if ("error" in uploaded) return { error: uploaded.error };
    logoPath = uploaded.path;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("site_trusted_partners")
    .insert({ name, logo_path: logoPath });

  if (error) {
    if (logoPath) await createAdminClient().storage.from("site-images").remove([logoPath]);
    return { error: error.message };
  }

  revalidatePath("/portal/admin/website/trusted-by");
  revalidatePath("/");
  return null;
}

export async function updateTrustedPartner(
  partnerId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required." };

  const removeLogo = formData.get("remove_logo") === "on";
  const file = formData.get("logo");

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_trusted_partners")
    .select("logo_path")
    .eq("id", partnerId)
    .maybeSingle();
  if (!existing) return { error: "Partner not found." };

  let logoPath = existing.logo_path;

  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadLogo(file);
    if ("error" in uploaded) return { error: uploaded.error };
    logoPath = uploaded.path;
  } else if (removeLogo) {
    logoPath = null;
  }

  const { error } = await supabase
    .from("site_trusted_partners")
    .update({ name, logo_path: logoPath })
    .eq("id", partnerId);

  if (error) return { error: error.message };

  if (existing.logo_path && existing.logo_path !== logoPath) {
    await createAdminClient().storage.from("site-images").remove([existing.logo_path]);
  }

  revalidatePath("/portal/admin/website/trusted-by");
  revalidatePath("/");
  return null;
}

export async function deleteTrustedPartner(partnerId: string): Promise<{ error?: string }> {
  if (!(await requireAdmin())) return { error: "Not authorized." };

  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("site_trusted_partners")
    .select("logo_path")
    .eq("id", partnerId)
    .maybeSingle();

  const { error } = await supabase.from("site_trusted_partners").delete().eq("id", partnerId);
  if (error) return { error: error.message };

  if (existing?.logo_path) {
    await createAdminClient().storage.from("site-images").remove([existing.logo_path]);
  }

  revalidatePath("/portal/admin/website/trusted-by");
  revalidatePath("/");
  return {};
}
