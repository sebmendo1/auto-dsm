import { describe, expect, it } from "vitest";
import { normalizeRepoInput } from "./utils";

describe("normalizeRepoInput", () => {
  it("returns owner/name from slug", () => {
    expect(normalizeRepoInput("vercel/next.js")).toBe("vercel/next.js");
  });
  it("returns from https github url", () => {
    expect(
      normalizeRepoInput("https://github.com/foo/bar"),
    ).toBe("foo/bar");
  });
  it("rejects empty", () => {
    expect(normalizeRepoInput("  ")).toBeNull();
  });
});
