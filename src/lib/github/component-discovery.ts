import { Octokit } from "octokit";
import type { ComponentDiscoveryResult, DiscoveredComponent } from "./types";
import { getRepoPathIndex } from "./repo-path-index";

export async function discoverComponents(
  owner: string,
  repo: string,
  accessToken?: string,
  options?: { branch?: string },
): Promise<ComponentDiscoveryResult> {
  const octokit = new Octokit(accessToken ? { auth: accessToken } : {});
  const index = await getRepoPathIndex(octokit, owner, repo, options?.branch);
  const filePaths = index.paths;
  const componentPaths = findComponentDirectories(filePaths);
  const components = extractComponents(filePaths, componentPaths);
  components.sort((a, b) => a.name.localeCompare(b.name));

  return {
    success: true,
    repo: `${owner}/${repo}`,
    componentPaths,
    components,
    totalCount: components.length,
    defaultBranch: index.defaultBranch,
    commitSha: index.commitSha,
  };
}

function findComponentDirectories(filePaths: string[]): string[] {
  const componentDirs = new Set<string>();
  const patterns = [
    /^components\//i,
    /^component\//i,
    /^src\/components\//i,
    /^src\/Components\//i,
    /^src\/component\//i,
    /^src\/Component\//i,
    /^app\/components\//i,
    /^app\/component\//i,
    /^lib\/components\//i,
    /^packages\/ui\/src\//i,
    /^packages\/components\//i,
    /^ui\//i,
    /^src\/ui\//i,
    /\/components\//i,
    /\/component\//i,
  ];

  for (const filePath of filePaths) {
    for (const pattern of patterns) {
      if (pattern.test(filePath)) {
        const match = filePath.match(pattern);
        if (match) componentDirs.add(match[0]);
      }
    }
  }

  const dirs = Array.from(componentDirs);
  dirs.sort((a, b) => {
    const depthA = a.split("/").length;
    const depthB = b.split("/").length;
    if (depthA !== depthB) return depthB - depthA;
    return a.localeCompare(b);
  });

  const filtered: string[] = [];
  for (const dir of dirs) {
    const isPrefix = filtered.some((d) => d.startsWith(dir) && d !== dir);
    if (!isPrefix) filtered.push(dir);
  }

  return filtered.length > 0 ? filtered : ["components/", "component/", "src/components/", "src/component/"];
}

/** Repo paths of co-located styles for a component entry (not listed as separate components). */
function findCoLocatedStylePaths(componentFilePath: string, allPaths: string[]): string[] {
  const dir =
    componentFilePath.includes("/") ? componentFilePath.slice(0, componentFilePath.lastIndexOf("/")) : "";
  const baseName = componentFilePath.split("/").pop()?.replace(/\.(tsx|jsx|ts|js)$/i, "") ?? "";
  if (!baseName) return [];

  const prefix = dir ? `${dir}/` : "";
  const baseLower = baseName.toLowerCase();
  const out: string[] = [];

  for (const p of allPaths) {
    if (prefix && !p.startsWith(prefix)) continue;
    if (!prefix && p.includes("/")) continue;
    const fileName = p.split("/").pop() ?? "";
    let stem: string;
    if (fileName.endsWith(".module.css")) stem = fileName.slice(0, -".module.css".length);
    else if (fileName.endsWith(".scss")) stem = fileName.slice(0, -".scss".length);
    else if (fileName.endsWith(".css")) stem = fileName.slice(0, -".css".length);
    else continue;
    if (stem.toLowerCase() === baseLower) out.push(p);
  }
  return out;
}

function extractComponents(allPaths: string[], componentDirs: string[]): DiscoveredComponent[] {
  const components: DiscoveredComponent[] = [];
  const slugCounts = new Map<string, number>();

  for (const dir of componentDirs) {
    const componentFiles = allPaths.filter((path) => path.startsWith(dir));

    for (const filePath of componentFiles) {
      const component = parseComponentFile(filePath, dir);
      if (component) {
        component.relatedStylePaths = findCoLocatedStylePaths(filePath, allPaths);
        const baseSlug = component.slug;
        const existingCount = slugCounts.get(baseSlug) ?? 0;
        if (existingCount > 0) {
          component.slug = `${baseSlug}-${existingCount + 1}`;
        }
        slugCounts.set(baseSlug, existingCount + 1);
        components.push(component);
      }
    }
  }

  return components;
}

function parseComponentFile(filePath: string, componentDir: string): DiscoveredComponent | null {
  if (shouldSkipFile(filePath)) return null;

  const relativePath = filePath.slice(componentDir.length);
  const parts = relativePath.split("/");

  let fileName: string;
  let category: string | undefined;
  let hasIndex = false;

  if (parts.length === 1) {
    fileName = parts[0];
  } else if (parts.length === 2) {
    const [first, second] = parts;
    if (isIndexFile(second)) {
      fileName = first;
      hasIndex = true;
    } else if (isComponentFile(second)) {
      if (stripExtension(first).toLowerCase() === stripExtension(second).toLowerCase()) {
        fileName = first;
      } else {
        fileName = second;
        category = first;
      }
    } else {
      return null;
    }
  } else if (parts.length === 3) {
    const [cat, folder, file] = parts;
    if (isIndexFile(file)) {
      fileName = folder;
      category = cat;
      hasIndex = true;
    } else if (stripExtension(folder).toLowerCase() === stripExtension(file).toLowerCase()) {
      fileName = folder;
      category = cat;
    } else {
      // Treat deeper structure as categorized component (e.g., Table/Cells/TableHeader.tsx)
      if (isComponentFile(file)) {
        fileName = file;
        category = cat;
      } else {
        return null;
      }
    }
  } else {
    // Deeper nesting: use first segment as category and last file as component name
    const [cat, ...rest] = parts;
    const file = rest[rest.length - 1];
    if (!file || !isComponentFile(file)) return null;
    if (isIndexFile(file) && rest.length >= 2) {
      fileName = rest[rest.length - 2];
      category = cat;
      hasIndex = true;
    } else {
      fileName = file;
      category = cat;
    }
  }

  const name = fileNameToComponentName(fileName);
  const slug = fileNameToSlug(fileName);
  if (!name) return null;

  return {
    name,
    fileName,
    filePath,
    slug,
    category,
    hasIndex,
  };
}

function fileNameToComponentName(fileName: string): string | null {
  const name = stripExtension(fileName);
  if (name.startsWith("use-") || name.startsWith("use")) return null;
  if (name.endsWith(".test") || name.endsWith(".spec")) return null;
  if (name.endsWith(".stories")) return null;
  if (name === "index") return null;
  if (["types", "utils", "helpers", "constants", "context"].includes(name)) return null;

  return toPascalCase(name);
}

function fileNameToSlug(fileName: string): string {
  return stripExtension(fileName).toLowerCase();
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}

function isComponentFile(fileName: string): boolean {
  return /\.(tsx|jsx|ts|js)$/.test(fileName);
}

function isIndexFile(fileName: string): boolean {
  return /^(index)\.(tsx|jsx|ts|js)$/.test(fileName);
}

function stripExtension(fileName: string): string {
  return fileName.replace(/\.(tsx|jsx|ts|js)$/, "");
}

function shouldSkipFile(filePath: string): boolean {
  const skipPatterns = [
    /node_modules\//,
    /\.git\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /coverage\//,
    /\.(test|spec|stories)\.(tsx?|jsx?)$/,
    /\.(css|scss|less|md|mdx|json)$/,
    /__tests__\//,
    /__mocks__\//,
    /\.d\.ts$/,
  ];

  return skipPatterns.some((pattern) => pattern.test(filePath));
}

