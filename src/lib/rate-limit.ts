import type { NextResponse } from "next/server";
import { Errors } from "@/lib/errors";

/**
 * 🛡️ SPAM GUARD & THROTTLING: In-Memory Fixed-Window Rate Limiter.
 *
 * CONCEPT: 
 * - Limits operations (e.g., login attempts, issue creation) within a fixed timeframe.
 * - If a client makes more requests than allowed, we "throttle" them with a 429 Too Many Requests response.
 *
 * HOW IT WORKS:
 * - We identify clients using their forwarding IP address headers (X-Forwarded-For).
 * - Standard headers like `X-RateLimit-Limit` and `Retry-After` are appended to response payloads.
 *
 * ⚠️ IN-MEMORY STACK LIMITATION:
 * - State is stored in a JavaScript Map (`store`).
 * - This lives in-memory on the active Node process, meaning limits are local per instances and clear on restart.
 * - For multi-instance horizontal scaling, swap `store` for a Redis/Upstash connection.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

// Global in-memory map holding request buckets per client identifier.
const store = new Map<string, Bucket>();

// Memory leaks check: every 5 minutes we purge stale/expired rate limit buckets
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

/**
 * 🧹 MEMORY OPTIMIZATION: Garbage collects expired rate limit buckets.
 * Prevents memory consumption from growing unbounded in high-traffic deployments.
 */
function maybeCleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // epoch ms
  retryAfterSeconds: number;
}

/**
 * ⚡ CORE RATE LIMIT FUNCTION: Increments or initializes the request bucket.
 * Calculates if client has exceeded the threshold and returns timing reset stats.
 */
export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);

  const existing = store.get(key);
  
  // If the bucket doesn't exist or has expired, initialize a new window
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + opts.windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      success: true,
      limit: opts.limit,
      remaining: opts.limit - 1,
      reset: resetAt,
      retryAfterSeconds: 0,
    };
  }

  // Increment existing bucket request count
  existing.count += 1;
  const remaining = Math.max(0, opts.limit - existing.count);
  return {
    success: existing.count <= opts.limit,
    limit: opts.limit,
    remaining,
    reset: existing.resetAt,
    retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
  };
}

/**
 * 🔍 NETWORK IP PARSER: Extracts the real user IP address.
 * Walks through proxies/load balancers headers first (x-forwarded-for).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * 📝 HTTP HEADERS BUILDER: Maps rate limit state to standard security response headers.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
  };
  if (!result.success) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }
  return headers;
}

/** Attach rate-limit headers to a successful response. */
export function applyRateLimitHeaders<T>(
  res: NextResponse<T>,
  result: RateLimitResult,
): NextResponse<T> {
  for (const [key, value] of Object.entries(rateLimitHeaders(result))) {
    res.headers.set(key, value);
  }
  return res;
}

/**
 * 🛑 THROTTLE ENFORCER MIDDLEWARE: Checks request volume.
 * Throws a RATE_LIMITED exception on failures, automatically halting request execution.
 */
export function enforceRateLimit(
  req: Request,
  opts: { name: string; limit: number; windowMs: number; identifier?: string },
): RateLimitResult {
  const id = opts.identifier ?? getClientIp(req);
  const result = rateLimit(`${opts.name}:${id}`, {
    limit: opts.limit,
    windowMs: opts.windowMs,
  });
  if (!result.success) {
    throw Errors.rateLimited(
      `Too many requests. Please try again in ${result.retryAfterSeconds}s.`,
      {
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        retryAfterSeconds: result.retryAfterSeconds,
      },
    );
  }
  return result;
}
