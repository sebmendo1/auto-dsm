import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Supabase OAuth callback — PDF §6.
 * Exchanges the code, creates/ensures the app_users row, then routes based on:
 *   1. Pending repo in session (client-side sessionStorage) — handled by /auth/bridge page
 *   2. Existing connected repo → /dashboard
 *   3. GitHub OAuth → /onboarding (repo picker)
 *   4. Google OAuth → /onboarding (paste-URL mode)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) return NextResponse.redirect(`${origin}/login`);

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`,
    );
  }

  // Check if user already has a connected repo
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(`${origin}/login`);

  // Ensure app_users row exists (trigger should handle this but be safe)
  await supabase
    .from("app_users")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        github_login: (user.user_metadata?.user_name as string | undefined) ?? null,
      },
      { onConflict: "id" },
    );

  // Hand off to a client-side bridge so we can read sessionStorage for pending repo
  return NextResponse.redirect(`${origin}/auth/bridge`);
}
