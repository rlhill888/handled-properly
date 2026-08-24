import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

const PUBLIC_PORTAL_PATHS = ["/portal/signin"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPortalRoute = pathname.startsWith("/portal");
  const isPublicPortalPath = PUBLIC_PORTAL_PATHS.some((path) => pathname.startsWith(path));

  if (isPortalRoute && !isPublicPortalPath && !user) {
    const signInUrl = new URL("/portal/signin", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Role-based section routing (admin vs staff) happens in each section's
  // layout, which knows how to look up the caller's role — middleware only
  // enforces "must be signed in at all" here to keep it fast and simple.

  return response;
}
