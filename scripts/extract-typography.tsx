import { extractTypographyFromRepo } from "@/lib/github/fetcher";

const repo = process.argv[2];
const json = process.argv.includes("--json");

if (!repo) {
  console.error("Usage: npx tsx scripts/extract-typography.tsx owner/repo [--json]");
  process.exit(1);
}

const run = async () => {
  const results = await extractTypographyFromRepo(repo);
  const typography = results.flatMap((r) =>
    r.typography.map((t) => ({ ...t, source: r.source })),
  );
  const fonts = results.flatMap((r) => r.fonts.map((f) => ({ ...f, source: r.source })));

  if (json) {
    console.log(JSON.stringify({ total: typography.length, typography, fonts }, null, 2));
    return;
  }

  console.log(`Found ${typography.length} typography tokens from ${results.length} file(s).`);
  for (const token of typography) {
    console.log(`${token.name} = ${token.value} [${token.source}]`);
  }

  if (fonts.length > 0) {
    console.log("\nGoogle Fonts:");
    for (const font of fonts) {
      console.log(`${font.name} (${font.source})`);
    }
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
