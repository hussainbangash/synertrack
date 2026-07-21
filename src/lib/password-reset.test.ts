import { describe, it, expect } from "vitest";
import { generateResetToken, hashToken, RESET_TOKEN_TTL_MS } from "./password-reset";

describe("password reset tokens", () => {
  it("returns a token and a matching hash (raw token is never the stored value)", () => {
    const { token, tokenHash } = generateResetToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toBe(token);
    expect(hashToken(token)).toBe(tokenHash);
  });

  it("produces unique tokens", () => {
    const a = generateResetToken();
    const b = generateResetToken();
    expect(a.token).not.toBe(b.token);
    expect(a.tokenHash).not.toBe(b.tokenHash);
  });

  it("hashes deterministically", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("uses a 30-minute TTL", () => {
    expect(RESET_TOKEN_TTL_MS).toBe(30 * 60 * 1000);
  });
});
