import type { Role } from "@prisma/client";
import { readSessionToken } from "@/lib/cookies";
import { verifySession } from "@/lib/jwt";
import { Errors } from "@/lib/errors";

/**
 * Server-side session + RBAC helpers. The single source of truth for "who is
 * making this request and what may they do". Used by API routes and server
 * components; client components never call these directly.
 */

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
  name: string;
}

/** Returns the current user from the session cookie, or null if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await readSessionToken();
  if (!token) return null;
  const claims = await verifySession(token);
  if (!claims) return null;
  return {
    id: claims.sub,
    username: claims.username,
    role: claims.role,
    name: claims.name,
  };
}

/** Like getSessionUser but throws UNAUTHORIZED when there is no valid session. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw Errors.unauthorized();
  return user;
}

/** Requires an authenticated user whose role is in `roles`, else FORBIDDEN. */
export async function requireRole(...roles: Role[]): Promise<SessionUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw Errors.forbidden();
  return user;
}

export const isManager = (user: SessionUser): boolean => user.role === "MANAGER";
export const isClient = (user: SessionUser): boolean => user.role === "CLIENT";
