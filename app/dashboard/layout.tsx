"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showSidebar =
    pathname.startsWith("/dashboard/projects/") ||
    pathname.startsWith("/dashboard/brand/") ||
    pathname.startsWith("/dashboard/components/");

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        {showSidebar ? <Sidebar /> : null}
        <main className="flex-1 px-10 py-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
