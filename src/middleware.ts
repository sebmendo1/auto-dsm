import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Global middleware entry point.
 *
 * Wraps updateSession in a try/catch so that Supabase / network failures never
 * produce a MIDDLEWARE_INVOCATION_FAILED 500 at the edge. On any unexpected
 * error we log it and pass the request through untouched.
 */
export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (err) {
    console.error("[middleware] Unhandled error:", err);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static
     * - _next/image
     * - favicon.ico, brand assets, public files with extensions
     * - Next.js metadata routes (OG images, sitemaps, robots, manifest)
     */
    "/((?!_next/static|_next/image|favicon.ico|brand/|opengraph-image|twitter-image|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
