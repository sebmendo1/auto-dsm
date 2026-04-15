import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { HomePage } from "@/pages/HomePage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/OnboardingPage";
import { DashboardHomePage } from "@/pages/DashboardHomePage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { BrandColorsPage } from "@/pages/BrandColorsPage";
import { BrandTypographyPage } from "@/pages/BrandTypographyPage";
import { ComponentSlugPage } from "@/pages/ComponentSlugPage";
import { DashboardTestPage } from "@/pages/DashboardTestPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AssetsPage } from "@/pages/AssetsPage";

function RootLayout() {
  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <HomePage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/onboarding", element: <OnboardingPage /> },
      {
        path: "/dashboard",
        element: <DashboardLayout />,
        children: [
          { index: true, element: <DashboardHomePage /> },
          { path: "dev/workbench", element: <DashboardTestPage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "assets", element: <AssetsPage /> },
          { path: "projects/:id", element: <ProjectDetailPage /> },
          { path: "brand/colors", element: <BrandColorsPage /> },
          { path: "brand/typography", element: <BrandTypographyPage /> },
          { path: "components/:slug", element: <ComponentSlugPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
