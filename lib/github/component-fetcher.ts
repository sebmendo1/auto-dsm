import { Octokit } from "octokit";

export interface FetchedComponent {
  name: string;
  filePath: string;
  source: string;
  dependencies: string[];
}

export async function fetchComponentSource(
  owner: string,
  repo: string,
  filePath: string,
  accessToken?: string,
  branch?: string,
): Promise<FetchedComponent> {
  const octokit = new Octokit(accessToken ? { auth: accessToken } : {});

  let targetBranch = branch;
  if (!targetBranch) {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    targetBranch = repoData.default_branch;
  }

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: filePath,
    ref: targetBranch,
  });

  if (!("content" in data) || data.encoding !== "base64") {
    throw new Error(`Cannot read file: ${filePath}`);
  }

  const source = Buffer.from(data.content, "base64").toString("utf-8");
  const name = extractComponentName(source, filePath);
  const dependencies = extractDependencies(source);

  return {
    name,
    filePath,
    source,
    dependencies,
  };
}

function extractComponentName(source: string, filePath: string): string {
  const funcMatch = source.match(
    /export\s+(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)/,
  );
  if (funcMatch) return funcMatch[1];

  const constMatch = source.match(
    /export\s+(?:default\s+)?const\s+([A-Z][a-zA-Z0-9]*)/,
  );
  if (constMatch) return constMatch[1];

  const forwardRefMatch = source.match(
    /const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*React\.forwardRef/,
  );
  if (forwardRefMatch) return forwardRefMatch[1];

  const fileName = filePath.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "") || "Component";
  return toPascalCase(fileName);
}

function extractDependencies(source: string): string[] {
  const deps: string[] = [];
  const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  while ((match = importRegex.exec(source)) !== null) {
    const dep = match[1];
    if (!dep.startsWith(".") && !dep.startsWith("@/")) {
      deps.push(dep);
    }
  }

  return Array.from(new Set(deps));
}

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
}
