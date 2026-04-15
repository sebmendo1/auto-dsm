import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { seedShowcaseDataIfEnabled } from "@/lib/demo/seed-showcase-data";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { router } from "./router";
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";

seedShowcaseDataIfEnabled();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>,
);
