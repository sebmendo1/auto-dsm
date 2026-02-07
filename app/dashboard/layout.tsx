import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 px-10 py-10">
          <div className="mx-auto flex max-w-5xl flex-col gap-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
