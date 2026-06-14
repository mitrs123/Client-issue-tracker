import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { signSession } from "@/lib/jwt";
import { Errors } from "@/lib/errors";
import type { LoginInput } from "@/lib/validations/auth";
import { safeUserSelect, type SafeUser } from "@/services/user.service";

export interface LoginResult {
  user: SafeUser;
  token: string;
}

/**
 * Validate credentials and mint a session token. The route layer is
 * responsible for placing the token into an HttpOnly cookie. We return a
 * generic error for both "no such user" and "wrong password" to avoid user
 * enumeration.
 */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findFirst({
    where: { username: input.username, deletedAt: null },
  });

  const genericError = Errors.unauthorized("Invalid username or password");
  if (!user || !user.isActive) {
    // Still run a comparison-shaped delay is overkill here; throw generic error.
    throw genericError;
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw genericError;

  const token = await signSession({
    sub: user.id,
    username: user.username,
    role: user.role,
    name: user.name,
  });

  const safeUser = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: safeUserSelect,
  });

  return { user: safeUser, token };
}
