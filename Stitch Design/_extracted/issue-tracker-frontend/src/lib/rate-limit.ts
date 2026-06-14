import type { NextResponse } from "next/server";
import { Errors } from "@/lib/errors";

/**
 * In-memory fixed-window rate limiter.
 *
 * The client is identified from request headers (X-Forwarded-For / X-Real-IP),
 * and standard rate-limit headers are returned on the response. No external
 * dependency (Redis/Upstash) is required.
 *
 * NOTE: state lives in the process, so limits are per-instance and reset on
 * restart. This is appropriate for single-instance / dev deployments. For a
 * horizontally-scaled deployment, swap `store` for a shared store (documented
 * in PRODUCTION_READINESS.md) — call sites do not change.
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms when the window rolls over
}

const store = new Map<string, Bucket>();

const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

/** Drop expired buckets occasionally so memory stays bounded. */
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

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  maybeCleanup(now);

  const existing = store.get(key);
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

/** Derive a client identifier from forwarding headers. */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

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
 * Enforce a limit for the current request, keyed by `name` + client IP. Throws
 * a RATE_LIMITED AppError (carrying header details) when exceeded; returns the
 * result on success so the caller can echo headers.
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
