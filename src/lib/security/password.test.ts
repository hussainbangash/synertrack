import { describe, expect, it } from "vitest";
import { passwordSchema } from "./password";

describe("password policy", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("StrongPass123").success).toBe(true);
  });

  it("rejects short or weak passwords", () => {
    expect(passwordSchema.safeParse("password123").success).toBe(false);
    expect(passwordSchema.safeParse("NoNumberPassword").success).toBe(false);
    expect(passwordSchema.safeParse("nouppercase123").success).toBe(false);
  });
});
