import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit, resetRateLimits } from "./rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests up to the limit and blocks the next one", () => {
    const key = "login:1.2.3.4:user@demo.com";
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000).success).toBe(true);
    }
    const blocked = rateLimit(key, 5, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks different keys independently", () => {
    expect(rateLimit("a", 1, 60_000).success).toBe(true);
    expect(rateLimit("a", 1, 60_000).success).toBe(false);
    expect(rateLimit("b", 1, 60_000).success).toBe(true);
  });
});
