// One-off helper: creates a Supabase Auth user and the matching `admins`
// row on the HOSTED project, so /portal/signin has something to
// authenticate against when .env.local is pointed at it (the default).
// Mirror of seed-local-admin.mjs with the inverse guard — refuses to run
// against 127.0.0.1, since that's what the local script is for.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || url.includes("127.0.0.1")) {
  console.error(`Refusing to run: NEXT_PUBLIC_SUPABASE_URL looks local (${url}). Use seed-local-admin.mjs instead.`);
  process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error("Usage: node scripts/seed-hosted-admin.mjs <email> <password>");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (createError) {
  console.error("Failed to create auth user:", createError.message);
  process.exit(1);
}

const { error: adminError } = await supabase
  .from("admins")
  .insert({ auth_user_id: created.user.id });

if (adminError) {
  console.error("Failed to insert admins row:", adminError.message);
  process.exit(1);
}

console.log(`Admin ready on hosted project: ${email}`);
console.log(`Sign in at ${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/portal/signin`);
