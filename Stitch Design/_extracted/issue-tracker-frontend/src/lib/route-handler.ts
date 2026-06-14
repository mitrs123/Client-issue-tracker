import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { fail } from "@/lib/api-response";
import { logger } from "@/lib/logger";

/**
 * Wraps an App Router route handler with centralized error handling so routes
 * only parse input, call services, and return responses (Master Plan §2.3).
 * Business logic throws typed AppErrors / ZodErrors; this maps them to the
 * standardized error envelope with the correct status code.
 */
export type RouteContext<P = Record<string, never>> = { params: Promise<P> };

type Handler<P> = (
  req: NextRequest,
  ctx: RouteContext<P>,
) => Promise<NextResponse> | NextResponse;

export function handle<P = Record<string, never>>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: RouteContext<P>): Promise<NextResponse> => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return toErrorResponse(err, req);
    }
  };
}

function toErrorResponse(err: unknown, req: NextRequest): NextResponse {
  if (err instanceof ZodError) {
    return fail("VALIDATION_ERROR", "Validation failed", 422, err.flatten());
  }

  if (err instanceof AppError) {
    const res = fail(err.code, err.message, err.status, err.details);
    // Echo rate-limit headers on 429 so clients can back off correctly.
    if (
      err.code === "RATE_LIMITED" &&
      err.details &&
      typeof err.details === "object"
    ) {
      const d = err.details as {
        retryAfterSeconds?: number;
        limit?: number;
        remaining?: number;
        reset?: number;
      };
      if (d.retryAfterSeconds != null)
        res.headers.set("Retry-After", String(d.retryAfterSeconds));
      if (d.limit != null)
        res.headers.set("X-RateLimit-Limit", String(d.limit));
      if (d.remaining != null)
        res.headers.set("X-RateLimit-Remaining", String(d.remaining));
      if (d.reset != null)
        res.headers.set("X-RateLimit-Reset", String(Math.ceil(d.reset / 1000)));
    }
    return res;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return fail("CONFLICT", "A record with these details already exists", 409, {
        target: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return fail("NOT_FOUND", "Resource not found", 404);
    }
  }

  // Unknown / unexpected — log server-side, return opaque 500 (no leak).
  logger.error("Unhandled route error", {
    path: req.nextUrl.pathname,
    method: req.method,
    error: err instanceof Error ? err.message : String(err),
  });
  return fail("INTERNAL_ERROR", "Something went wrong", 500);
}
