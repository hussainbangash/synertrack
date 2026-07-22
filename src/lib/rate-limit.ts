/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * This has NO external dependencies and is good enough for a single instance
 * (local dev, a single container). For multi-instance / serverless production
 * deployments the in-memory Map is not shared across instances - swap this for a
 * distributed store such as Upstash Redis (`@upstash/ratelimit`) and keep the
 * same `rateLimit()` signature.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export type RateLimitResult = {
  success: boolean;
  remaining: number;
  retryAfterMs: number;
};

/**
 * Record a hit for `key` and report whether it is within the allowed budget.
 *
 * @param key       stable identifier (e.g. `login:<ip>:<email>`)
 * @param limit     max hits allowed per window
 * @param windowMs  window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit = 5,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, retryAfterMs: 0 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, retryAfterMs: entry.resetAt - now };
  }

  entry.count += 1;
  return { success: true, remaining: limit - entry.count, retryAfterMs: 0 };
}

/** Clear all counters (used by tests). */
export function resetRateLimits(): void {
  store.clear();
}
