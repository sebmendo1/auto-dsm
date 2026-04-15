import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";

export function DashboardLayout() {
  return (
    <div className="flex min-h-screen bg-surface-base text-content-primary">
      <Sidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col p-3 sm:p-4 md:p-5">
        <div className="app-well flex min-h-0 flex-1 flex-col overflow-auto">
          <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col px-5 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
