"use server";

import { createClient } from "@/lib/supabase/server";

export type ActionState = { error: string } | null;

export async function setPassword(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirmPassword) return { error: "Passwords don't match." };

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your invite link has expired. Ask an admin to resend it." };

  const { error: updateError } = await supabase.auth.updateUser({ password });
  if (updateError) return { error: updateError.message };

  // No-op for an admin session (admins aren't in event_staff); scoped to
  // auth.uid() server-side, so this only ever touches the caller's own row.
  await supabase.rpc("activate_own_staff_account");

  return null;
}
