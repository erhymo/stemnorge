/**
 * In-memory sliding-window rate limiter.
 *
 * ARCHITECTURE NOTE:
 * This implementation stores counters in process memory. On Vercel (serverless),
 * each cold-start gets its own Map, so the limit is per-instance rather than
 * global. This is acceptable because:
 *   1. It still deters casual abuse and simple bots.
 *   2. Vercel's edge network already provides basic DDoS mitigation.
 *   3. Bcrypt's cost factor provides an inherent rate limit on auth endpoints.
 *
 * For stricter global rate limiting, replace the `buckets` Map with a shared
 * store such as Vercel KV or Upstash Redis. The `checkRateLimit` interface
 * would stay the same – only the storage backend would change.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;

  for (const [key, entry] of buckets) {
    if (entry.resetAt <= now) {
      buckets.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Unique namespace for this limiter (e.g. "register", "login") */
  namespace: string;
  /** Maximum number of requests allowed within the window */
  maxRequests: number;
  /** Time window in seconds */
  windowSeconds: number;
};

/**
 * Check whether the given IP is within the rate limit for the given config.
 *
 * Returns `{ allowed: true }` when the request should proceed, or
 * `{ allowed: false, retryAfterSeconds }` when the limit has been exceeded.
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();
  cleanup(now);

  const key = `${config.namespace}:${ip}`;
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + config.windowSeconds * 1000 });
    return { allowed: true };
  }

  existing.count += 1;

  if (existing.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((existing.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  return { allowed: true };
}

/**
 * Extract client IP from a Next.js API request.
 * Vercel sets x-forwarded-for automatically.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined> | undefined): string {
  if (!headers) {
    return "unknown";
  }

  const forwarded = headers["x-forwarded-for"];
  const raw = Array.isArray(forwarded) ? forwarded[0] : forwarded;

  if (raw) {
    // x-forwarded-for can be "client, proxy1, proxy2" — take the first
    return raw.split(",")[0].trim();
  }

  return "unknown";
}

