import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMyBrand } from "@/lib/brand/load";
import { getDevPreviewRepoSlug, isDevAuthBypassEnabled } from "@/lib/dev/local-preview";
import { Sidebar } from "@/components/shell/sidebar";
import { TopBar } from "@/components/shell/topbar";
import { BrandProvider } from "@/components/brand/brand-provider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isDevAuthBypassEnabled() && !user) redirect("/login");

  const brand = await loadMyBrand();
  if (!brand) redirect("/onboarding");

  if (brand.status === "unsupported") {
    redirect(
      `/onboarding/unsupported?repo=${encodeURIComponent(brand.repoSlug)}&reason=${encodeURIComponent(brand.unsupportedReason ?? "")}`,
    );
  }

  const userLabel = isDevAuthBypassEnabled()
    ? `Dev preview · ${getDevPreviewRepoSlug()}`
    : ((user.user_metadata?.user_name as string | undefined) ??
      (user.user_metadata?.full_name as string | undefined) ??
      user?.email ??
      "You");

  return (
    <BrandProvider profile={brand.profile} repoSlug={brand.repoSlug}>
      <div className="flex min-h-screen bg-[var(--bg-primary)]">
        <Sidebar userLabel={userLabel} />
        <div className="flex-1 min-w-0 p-4 pl-0">
          <div className="flex-1 min-h-[calc(100vh-2rem)] bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-subtle)] overflow-hidden shadow-[var(--shadow-sm)]">
            {isDevAuthBypassEnabled() ? (
              <div className="shrink-0 border-b border-[color-mix(in_srgb,var(--warning)_35%,transparent)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] px-4 py-2 text-center text-[12px] leading-[16px] text-[var(--text-secondary)]">
                Local UI preview: set{" "}
                <code className="font-[var(--font-geist-mono)] text-[11px]">DEV_PREVIEW_REPO=owner/repo</code> in{" "}
                <code className="font-[var(--font-geist-mono)] text-[11px]">.env.local</code> and restart dev — no commit
                needed.
              </div>
            ) : null}
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
