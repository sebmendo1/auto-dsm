import { NextRequest, NextResponse } from "next/server";

/**
 * Preview mode toggle.
 *
 *   GET /api/preview          → set autodsm_preview cookie, redirect to /dashboard
 *   GET /api/preview?off=1    → clear cookie, redirect to /
 *   GET /api/preview?to=/...  → redirect to a specific path after enabling
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const off = searchParams.get("off") === "1";
  const to = searchParams.get("to") ?? "/dashboard";

  const redirectUrl = new URL(to, req.url);
  const res = NextResponse.redirect(redirectUrl);

  if (off) {
    res.cookies.set("autodsm_preview", "", {
      path: "/",
      maxAge: 0,
    });
  } else {
    res.cookies.set("autodsm_preview", "1", {
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
      sameSite: "lax",
    });
  }

  return res;
}
