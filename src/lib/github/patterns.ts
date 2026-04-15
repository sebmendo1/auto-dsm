import type { ThemeFileCandidate } from "./types";

const FILE_PATTERNS: Array<{
  pattern: RegExp;
  tier: 1 | 2 | 3 | 4;
  type: ThemeFileCandidate["type"];
}> = [
  { pattern: /theme\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },
  { pattern: /theme\/index\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },
  { pattern: /tokens?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "tokens" },
  { pattern: /design-?tokens?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "tokens" },
  { pattern: /colors?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /palette\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /theme\/colors?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /theme\/palette\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /theme\/tokens?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "tokens" },
  { pattern: /styles\/theme\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },
  { pattern: /styles\/colors?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /styles\/tokens?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "tokens" },
  { pattern: /constants\/colors?\.(ts|tsx|js|jsx)$/i, tier: 1, type: "colors" },
  { pattern: /constants\/theme\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },
  { pattern: /config\/theme\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },
  { pattern: /lib\/theme\.(ts|tsx|js|jsx)$/i, tier: 1, type: "theme" },

  { pattern: /tailwind\.config\.(ts|js|mjs|cjs)$/i, tier: 2, type: "tailwind" },
  { pattern: /tailwind\.css$/i, tier: 2, type: "css" },
  { pattern: /assets\/styles\/tailwind\.css$/i, tier: 2, type: "css" },
  { pattern: /customstyles\.astro$/i, tier: 2, type: "css" },
  { pattern: /styles?\.astro$/i, tier: 3, type: "css" },
  { pattern: /typography\.(css|ts|tsx|js|jsx)$/i, tier: 2, type: "css" },
  { pattern: /text-styles?\.(css|ts|tsx|js|jsx)$/i, tier: 2, type: "css" },
  { pattern: /(^|\/)fonts\.(ts|tsx|js|jsx)$/i, tier: 2, type: "tokens" },
  { pattern: /globals?\.css$/i, tier: 2, type: "css" },
  { pattern: /variables?\.css$/i, tier: 2, type: "css" },
  { pattern: /vars\.css$/i, tier: 2, type: "css" },
  { pattern: /index\.css$/i, tier: 2, type: "css" },
  { pattern: /app\.css$/i, tier: 2, type: "css" },
  { pattern: /GlobalStyles?\.(ts|tsx|js|jsx)$/i, tier: 2, type: "theme" },
  { pattern: /extendTheme\.(ts|tsx|js|jsx)$/i, tier: 2, type: "theme" },
  { pattern: /mui-theme\.(ts|tsx|js|jsx)$/i, tier: 2, type: "theme" },
  { pattern: /createTheme\.(ts|tsx|js|jsx)$/i, tier: 2, type: "theme" },
  { pattern: /mantine(-theme)?\.(ts|tsx|js|jsx)$/i, tier: 2, type: "theme" },

  { pattern: /design-system\/(tokens?|theme|colors?)\//, tier: 3, type: "tokens" },
  { pattern: /ds\/(tokens?|theme|colors?)\//, tier: 3, type: "tokens" },
  { pattern: /primitives\/(colors?|tokens?)\.(ts|tsx|js|jsx)$/i, tier: 3, type: "tokens" },
  { pattern: /foundation\/(colors?|tokens?)\.(ts|tsx|js|jsx)$/i, tier: 3, type: "tokens" },
  { pattern: /\.storybook\/theme\.(ts|tsx|js|jsx)$/i, tier: 3, type: "theme" },
  { pattern: /tokens\/.*\.json5?$/i, tier: 3, type: "tokens" },

  { pattern: /^theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
  { pattern: /^colors?\.(ts|tsx|js|jsx)$/i, tier: 4, type: "colors" },
  { pattern: /^src\/theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
  { pattern: /^src\/colors?\.(ts|tsx|js|jsx)$/i, tier: 4, type: "colors" },
  { pattern: /^src\/styles\/theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
  { pattern: /^src\/styles\/colors?\.(ts|tsx|js|jsx)$/i, tier: 4, type: "colors" },
  { pattern: /^app\/theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
  { pattern: /^config\/colors?\.(ts|tsx|js|jsx)$/i, tier: 4, type: "colors" },
  { pattern: /^shared\/theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
  { pattern: /^common\/theme\.(ts|tsx|js|jsx)$/i, tier: 4, type: "theme" },
];

export function matchThemeFile(path: string): ThemeFileCandidate | null {
  for (const { pattern, tier, type } of FILE_PATTERNS) {
    if (pattern.test(path)) {
      return {
        path,
        tier,
        type,
        confidence: calculateConfidence(path, tier, type),
      };
    }
  }
  return null;
}

function calculateConfidence(
  path: string,
  tier: number,
  type: ThemeFileCandidate["type"],
): number {
  let score = 100 - (tier - 1) * 20;

  if (/theme/i.test(path)) score += 10;
  if (/tokens?/i.test(path)) score += 10;
  if (/colors?/i.test(path)) score += 5;
  if (/design-system/i.test(path)) score += 15;
  if (/\.tsx?$/.test(path)) score += 5;
  if (/\.(test|spec|stories)\./i.test(path)) score -= 50;
  if (/node_modules/i.test(path)) score -= 100;
  if (/(^|\/)dist\//i.test(path) || /(^|\/)build\//i.test(path)) score -= 50;

  if (type === "tailwind") score += 5;
  if (type === "css") score += 2;

  return Math.max(0, Math.min(100, score));
}

export function findThemeFiles(filePaths: string[]): ThemeFileCandidate[] {
  const candidates: ThemeFileCandidate[] = [];

  for (const path of filePaths) {
    if (shouldSkipFile(path)) continue;

    const match = matchThemeFile(path);
    if (match) candidates.push(match);
  }

  return candidates.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.tier - b.tier;
  });
}

function shouldSkipFile(path: string): boolean {
  const skipPatterns = [
    /node_modules\//,
    /\.git\//,
    /dist\//,
    /build\//,
    /\.next\//,
    /coverage\//,
    /\.cache\//,
    /\.(test|spec|stories)\.(ts|tsx|js|jsx)$/,
    /\.(md|mdx|yml|yaml|lock|log)$/,
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
    /\.(woff|woff2|ttf|eot)$/,
    /__tests__\//,
    /__mocks__\//,
  ];

  return skipPatterns.some((pattern) => pattern.test(path));
}
