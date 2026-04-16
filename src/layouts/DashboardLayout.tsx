import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";

function RepoHeaderBar() {
  const [repo, setRepo] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setRepo(localStorage.getItem("autodsm:lastRepo"));
    sync();
    window.addEventListener("autodsm:updated", sync);
    window.addEventListener("storage", (e) => {
      if (e.key === "autodsm:lastRepo") sync();
    });
    return () => {
      window.removeEventListener("autodsm:updated", sync);
    };
  }, []);

  if (!repo) return null;

  return (
    <div className="flex h-11 shrink-0 items-center justify-center border-b border-hairline bg-surface-base/60 px-4">
      <span className="text-xs font-medium tracking-wide text-content-muted">{repo}</span>
    </div>
  );
}

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface-base text-content-primary">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <RepoHeaderBar />
        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4 md:p-5">
          <div className="app-well flex min-h-0 flex-1 flex-col overflow-auto">
            <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
