import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMyBrand } from "@/lib/brand/load";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";
import { BrandProvider } from "@/components/brand/brand-provider";
import { DEMO_BRAND_PROFILE, DEMO_REPO_SLUG } from "@/lib/brand/demo-profile";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ---- Preview mode gate ----
  // Enables /dashboard access without auth for design review / testing.
  // Triggers:
  //   • NEXT_PUBLIC_PREVIEW_MODE=1  (env, global)
  //   • autodsm_preview=1 cookie    (per-session, set via /api/preview)
  const cookieStore = await cookies();
  const previewCookie = cookieStore.get("autodsm_preview")?.value === "1";
  const previewEnv = process.env.NEXT_PUBLIC_PREVIEW_MODE === "1";
  const isPreview = previewCookie || previewEnv;

  if (isPreview) {
    return (
      <BrandProvider profile={DEMO_BRAND_PROFILE} repoSlug={DEMO_REPO_SLUG}>
        <div className="flex min-h-screen bg-[var(--bg-primary)]">
          <Sidebar userLabel="Preview" />
          <div className="flex-1 min-w-0 p-4 pl-0">
            <div className="flex-1 min-h-[calc(100vh-2rem)] bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-sm)]">
              <TopBar isPreview />
              <div className="h-[calc(100vh-2rem-3.5rem)] overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        </div>
      </BrandProvider>
    );
  }

  // ---- Normal authenticated flow ----
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const brand = await loadMyBrand();
  if (!brand) redirect("/onboarding");

  const userLabel =
    (user.user_metadata?.user_name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email ??
    "You";

  return (
    <BrandProvider profile={brand.profile} repoSlug={brand.repoSlug}>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <Sidebar userLabel={userLabel} />
        <div className="flex-1 min-w-0 p-4 pl-0">
          <div className="flex-1 min-h-[calc(100vh-2rem)] bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-sm)]">
            <TopBar />
            <div className="h-[calc(100vh-2rem-3.5rem)] overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </div>
    </BrandProvider>
  );
}
