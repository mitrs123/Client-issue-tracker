/**
 * Thin client-side fetch helper for use in "use client" components. Unwraps the
 * standardized API envelope and throws a typed error (with HTTP status +
 * Retry-After) so callers can render error.message and back off on 429.
 */

export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfter?: number;
  details?: unknown;
  constructor(
    message: string,
    opts: { status: number; code?: string; retryAfter?: number; details?: unknown },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status;
    this.code = opts.code;
    this.retryAfter = opts.retryAfter;
    this.details = opts.details;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { json?: unknown },
): Promise<T> {
  const { json, headers, ...rest } = init ?? {};
  const res = await fetch(path, {
    credentials: "include",
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    ...rest,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON response */
  }

  const body = payload as
    | { success: true; data: T }
    | { success: false; error: { code: string; message: string; details?: unknown } }
    | null;

  if (!res.ok || !body || body.success === false) {
    const retryHeader = res.headers.get("Retry-After");
    throw new ApiError(
      (body && body.success === false && body.error?.message) ||
        `Request failed (${res.status})`,
      {
        status: res.status,
        code: body && body.success === false ? body.error?.code : undefined,
        retryAfter: retryHeader ? Number(retryHeader) : undefined,
        details:
          body && body.success === false ? body.error?.details : undefined,
      },
    );
  }
  return body.data;
}
