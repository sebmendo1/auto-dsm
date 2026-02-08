import { NextRequest, NextResponse } from "next/server";
import { fetchComponentSource } from "@/lib/github/component-fetcher";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const repo = searchParams.get("repo");
    const filePath = searchParams.get("filePath");

    if (!repo || !filePath) {
      return NextResponse.json(
        { error: "Missing repo or filePath" },
        { status: 400 },
      );
    }

    const [owner, repoName] = repo.split("/");

    const fetched = await fetchComponentSource(owner, repoName, filePath);

    return NextResponse.json({
      name: fetched.name,
      filePath: fetched.filePath,
      source: fetched.source,
      dependencies: fetched.dependencies,
      hasDefaultExport: fetched.source.includes("export default"),
      exportName: fetched.name,
    });
  } catch (error: any) {
    console.error("Component analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 },
    );
  }
}
