import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Supabase's local Auth site_url (supabase/config.toml) is 127.0.0.1:3000,
  // so auth email links land there — allow it as a dev origin alongside
  // localhost so Next doesn't block hydration for that host.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
};

export default nextConfig;
