import assert from "node:assert/strict";
import { resolveSpecifierToRepoBasePath } from "../src/lib/github/module-specifier-resolve";
import { matchPathsMapping, parseTsconfigCompilerOptions, type TsPathsConfig } from "../src/lib/github/tsconfig-paths";
import { npmInstallPackageName } from "../src/lib/sandpack/npm-spec";
import { relativeSpecifierBetweenRepoFiles, rewriteRepoSourceForSandpack } from "../src/lib/sandpack/repo-import-rewrite";

const ctx: TsPathsConfig = {
  configDir: "",
  baseUrl: ".",
  paths: { "@/*": ["./src/*"] },
};

assert.equal(npmInstallPackageName("react"), "react");
assert.equal(npmInstallPackageName("date-fns/format"), "date-fns");
assert.equal(npmInstallPackageName("@radix-ui/react-dialog"), "@radix-ui/react-dialog");
assert.equal(npmInstallPackageName("@radix-ui/react-dialog/foo"), "@radix-ui/react-dialog");
assert.equal(npmInstallPackageName("@/components/ui/button"), "@/components/ui/button");

assert.equal(matchPathsMapping("@/lib/utils", ctx.paths), "./src/lib/utils");

const resolved = resolveSpecifierToRepoBasePath("src/components/Button.tsx", "@/lib/utils", ctx);
assert.equal(resolved, "src/lib/utils");

const rel = relativeSpecifierBetweenRepoFiles("src/components/ui/button.tsx", "src/lib/utils.ts");
assert.match(rel, /^\.\.\/\.\.\/lib\/utils$/);

const graph = new Set(["src/components/ui/button.tsx", "src/lib/utils.ts"]);
const src = `import { cn } from "@/lib/utils";\nexport const x = 1;`;
const out = rewriteRepoSourceForSandpack("src/components/ui/button.tsx", src, graph, ctx);
assert.ok(!out.includes("@/"), out);
assert.ok(out.includes("from "), out);

const parsed = parseTsconfigCompilerOptions(
  JSON.stringify({ compilerOptions: { baseUrl: ".", paths: { "@/*": ["./src/*"] } } }),
);
assert.ok(parsed?.paths?.["@/*"]);

console.log("test-sandpack-helpers: ok");
