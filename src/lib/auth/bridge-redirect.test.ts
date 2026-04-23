import { describe, expect, it } from "vitest";
import { getAuthBridgePath } from "./bridge-redirect";

describe("getAuthBridgePath", () => {
  it("prefers pending repo → scanning", () => {
    expect(
      getAuthBridgePath({
        hasPendingRepo: true,
        pendingRepo: "a/b",
        hasBrandRepo: true,
        profileCompleted: true,
      }),
    ).toBe("/onboarding/scanning?repo=a%2Fb");
  });
  it("sends to dashboard when brand_repos exists", () => {
    expect(
      getAuthBridgePath({
        hasPendingRepo: false,
        pendingRepo: null,
        hasBrandRepo: true,
        profileCompleted: false,
      }),
    ).toBe("/dashboard");
  });
  it("sends to connect when profile done but no repo", () => {
    expect(
      getAuthBridgePath({
        hasPendingRepo: false,
        pendingRepo: null,
        hasBrandRepo: false,
        profileCompleted: true,
      }),
    ).toBe("/onboarding/connect");
  });
  it("sends to welcome for new user", () => {
    expect(
      getAuthBridgePath({
        hasPendingRepo: false,
        pendingRepo: null,
        hasBrandRepo: false,
        profileCompleted: false,
      }),
    ).toBe("/onboarding/welcome");
  });
});
