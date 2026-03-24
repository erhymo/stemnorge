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
 * Simple in-memory rate limiter keyed by IP + namespace.
 * Works per serverless instance – not perfectly shared, but good
 * enough to deter casual abuse and simple bot attacks.
 *
 * Returns `{ allowed: true }` or `{ allowed: false, retryAfterSeconds }`.
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

