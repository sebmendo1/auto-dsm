import { describe, expect, it } from "vitest";
import { z } from "zod";

const ROLE_OPTIONS = [
  { value: "founder" },
] as const;
const TEAM_SIZE_OPTIONS = [{ value: "solo" }] as const;
const stepValues = new Set(["welcome", "connect", "scanning"]);

const patchBody = z
  .object({
    displayName: z.string().optional(),
    role: z
      .string()
      .refine((v) => v === "" || (ROLE_OPTIONS as readonly { value: string }[]).map((r) => r.value).includes(v), "Invalid")
      .optional(),
    teamSize: z
      .string()
      .refine(
        (v) => v === "" || (TEAM_SIZE_OPTIONS as readonly { value: string }[]).map((t) => t.value).includes(v),
        "Invalid",
      )
      .optional(),
    currentStep: z
      .string()
      .refine(
        (v) => v === "" || (v !== "" && stepValues.has(v)),
        "Invalid step",
      )
      .optional(),
  })
  .strict();

describe("onboarding patch contract", () => {
  it("accepts valid role and step", () => {
    const r = patchBody.safeParse({ role: "founder", currentStep: "scanning" });
    expect(r.success).toBe(true);
  });
  it("rejects unknown fields", () => {
    const r = patchBody.safeParse({ extra: 1 });
    expect(r.success).toBe(false);
  });
});
