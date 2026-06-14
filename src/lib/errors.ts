/**
 * Typed application errors. Services throw these; the route-handler wrapper
 * maps them to standardized HTTP responses. This keeps business logic free of
 * HTTP concerns while still producing correct status codes.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "FEATURE_DISABLED"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  FEATURE_DISABLED: 503,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const Errors = {
  badRequest: (msg = "Bad request", details?: unknown) =>
    new AppError("BAD_REQUEST", msg, details),
  validation: (msg = "Validation failed", details?: unknown) =>
    new AppError("VALIDATION_ERROR", msg, details),
  unauthorized: (msg = "Authentication required") =>
    new AppError("UNAUTHORIZED", msg),
  forbidden: (msg = "You do not have permission to perform this action") =>
    new AppError("FORBIDDEN", msg),
  notFound: (msg = "Resource not found") => new AppError("NOT_FOUND", msg),
  conflict: (msg = "Resource conflict", details?: unknown) =>
    new AppError("CONFLICT", msg, details),
  rateLimited: (msg = "Too many requests", details?: unknown) =>
    new AppError("RATE_LIMITED", msg, details),
  featureDisabled: (msg = "This feature is currently unavailable") =>
    new AppError("FEATURE_DISABLED", msg),
  internal: (msg = "Something went wrong") =>
    new AppError("INTERNAL_ERROR", msg),
};
