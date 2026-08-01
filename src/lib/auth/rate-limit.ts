/**
 * In-memory sliding-window rate limiter, keyed by email rather than IP —
 * there's no reverse proxy in front of this deployment to supply a
 * trustworthy X-Forwarded-For, so IP-based limiting would be trivially
 * spoofable. Keying by email defends the realistic threat (credential
 * stuffing / signup spam against one address) without depending on
 * infrastructure that doesn't exist yet.
 *
 * Explicitly interim: state is in-process (lost on redeploy/restart) and
 * doesn't coordinate across multiple app instances. A real fix needs
 * Redis-backed limiting behind a reverse proxy — out of scope for this
 * single-instance deployment (docs/assumptions.md).
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

export class RateLimitError extends Error {
  constructor(retryAfterMs: number) {
    super(`Too many attempts. Try again in ${Math.ceil(retryAfterMs / 1000)}s.`);
    this.name = "RateLimitError";
  }
}

/**
 * Throws RateLimitError if `key` has exceeded `max` attempts within
 * `windowMs`. Defaults (5 attempts / 15 minutes) suit login attempts;
 * callers with different needs (e.g. signup) pass their own limits.
 */
export function checkRateLimit(key: string, max = 5, windowMs = 15 * 60 * 1000): void {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return;
  }

  if (bucket.count >= max) {
    throw new RateLimitError(windowMs - (now - bucket.windowStart));
  }

  bucket.count += 1;
}
