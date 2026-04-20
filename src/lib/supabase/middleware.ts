import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicKey, getSupabaseUrl } from "./env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/**
 * Touches the Supabase session and refreshes auth cookies on every request.
 *
 * Fails soft:
 *   - If Supabase env vars are missing, the request is passed through unmodified.
 *   - Any error inside createServerClient or getUser is caught and logged so
 *     that middleware never 500s the whole app.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = getSupabaseUrl();
  const key = getSupabasePublicKey();

  if (!url || !key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[middleware] Missing Supabase URL or public key (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL and publishable or anon key) — skipping session refresh.",
      );
    }
    return response;
  }

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }: CookieToSet) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    await supabase.auth.getUser();
  } catch (err) {
    // Never let middleware throw — the whole app would 500.
    console.error("[middleware] Supabase session refresh failed:", err);
  }

  return response;
}
