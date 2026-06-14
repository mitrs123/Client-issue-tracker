import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";

/**
 * Custom JWT signing/verification using `jose` (works in both the Node and Edge
 * runtimes). HS256 with the server-only JWT_SECRET. Tokens are transported only
 * via HttpOnly cookies — never localStorage (.clauderules §3).
 */

const secret = new TextEncoder().encode(env.JWT_SECRET);
const ALG = "HS256";

export interface SessionClaims {
  sub: string; // user id
  username: string;
  role: Role;
  name: string;
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({
    username: claims.username,
    role: claims.role,
    name: claims.name,
  })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(secret);
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: [ALG] });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.role !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }
    return {
      sub: payload.sub,
      username: payload.username,
      role: payload.role as Role,
      name: payload.name,
    };
  } catch {
    return null;
  }
}
