import { NextRequest, NextResponse } from "next/server";
import { discoverComponents } from "@/lib/github/component-discovery";

export async function POST(request: NextRequest) {
  try {
    const { repoFullName } = await request.json();

    if (!repoFullName || !repoFullName.includes("/")) {
      return NextResponse.json(
        { error: "Invalid repo. Use: owner/repo" },
        { status: 400 },
      );
    }

    const [owner, repo] = repoFullName.split("/");
    const result = await discoverComponents(owner, repo);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Component discovery error:", error);

    if (error.status === 404) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    return NextResponse.json(
      { error: error.message || "Discovery failed" },
      { status: 500 },
    );
  }
}
