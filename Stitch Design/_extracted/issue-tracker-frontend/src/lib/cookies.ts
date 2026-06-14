import { cookies } from "next/headers";

/**
 * Session cookie helpers. The token is stored ONLY in an HttpOnly, SameSite
 * cookie; it is never exposed to client-side JS (.clauderules §3).
 */
export const SESSION_COOKIE = "cit_session";

const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function readSessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
