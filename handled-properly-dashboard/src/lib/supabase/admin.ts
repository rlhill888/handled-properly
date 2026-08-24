import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client for trusted, server-only operations that must bypass
// RLS by design: public form submissions (anon fill-in), staff invites,
// mass-email sends. Never import this from a Client Component or expose the
// key it uses to the browser bundle.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
