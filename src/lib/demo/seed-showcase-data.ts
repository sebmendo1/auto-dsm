import { cacheKeyForComponent, setCachedComponentSource } from "@/lib/sandpack/component-source-cache";
import type { CachedComponentPayload } from "@/lib/sandpack/component-source-cache";
import { isDemoDataEnabled } from "./demo-mode";
import { DEMO_REPO_FULL_NAME } from "./demo-mode";
import { DEMO_COMPONENTS, DEMO_PARSE_RESULT, DEMO_SANDBOX_SOURCE } from "./showcase-fixtures";

const ASSETS_REPO_KEY = "autodsm:assetsRepo";

function buildDemoPayload(componentName: string, filePath: string): CachedComponentPayload {
  return {
    name: componentName,
    filePath,
    source: DEMO_SANDBOX_SOURCE,
    dependencies: ["react"],
    hasDefaultExport: true,
    exportName: "ShowcaseDemo",
    useTailwindInPreview: false,
  };
}

/**
 * When `VITE_USE_DEMO_DATA=true`, seeds localStorage only if both `autodsm:tokens` and
 * `autodsm:components` are absent — avoids overwriting a real parse.
 */
export function seedShowcaseDataIfEnabled(): void {
  if (!isDemoDataEnabled() || typeof window === "undefined") return;

  const hasTokens = localStorage.getItem("autodsm:tokens");
  const hasComponents = localStorage.getItem("autodsm:components");
  if (hasTokens || hasComponents) return;

  localStorage.setItem("autodsm:tokens", JSON.stringify(DEMO_PARSE_RESULT));
  localStorage.setItem("autodsm:components", JSON.stringify(DEMO_COMPONENTS));
  localStorage.setItem("autodsm:lastRepo", DEMO_REPO_FULL_NAME);
  localStorage.setItem(ASSETS_REPO_KEY, DEMO_REPO_FULL_NAME);
  localStorage.setItem("autodsm:repoBranch", "main");

  for (const c of DEMO_COMPONENTS) {
    const key = cacheKeyForComponent(DEMO_REPO_FULL_NAME, c.slug);
    setCachedComponentSource(key, buildDemoPayload(c.name, c.filePath));
  }

  window.dispatchEvent(new CustomEvent("autodsm:updated"));
}
