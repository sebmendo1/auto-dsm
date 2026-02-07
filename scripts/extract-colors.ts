import { extractColorsFromRepo } from "@/lib/github/fetcher";

const repo = process.argv[2];
const json = process.argv.includes("--json");

if (!repo) {
  console.error("Usage: npx tsx scripts/extract-colors.ts owner/repo [--json]");
  process.exit(1);
}

const run = async () => {
  const results = await extractColorsFromRepo(repo);
  const colors = results.flatMap((r) => r.colors.map((c) => ({ ...c, source: r.source })));

  if (json) {
    console.log(JSON.stringify({ total: colors.length, colors }, null, 2));
    return;
  }

  console.log(`Found ${colors.length} colors from ${results.length} file(s).`);
  for (const color of colors) {
    console.log(`${color.name} = ${color.value} (${color.category ?? "uncategorized"}) [${color.source}]`);
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
