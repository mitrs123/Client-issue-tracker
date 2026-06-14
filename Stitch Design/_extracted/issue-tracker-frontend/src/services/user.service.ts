import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";

/**
 * Safe user projection — never includes passwordHash. Reused across services so
 * we never accidentally serialize the hash to a client.
 */
export const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof safeUserSelect }>;

/** Managers can list all client users (e.g. to assign website ownership). */
export async function listClients(actor: SessionUser): Promise<SafeUser[]> {
  if (actor.role !== "MANAGER") throw Errors.forbidden();
  return prisma.user.findMany({
    where: { role: "CLIENT", deletedAt: null },
    select: safeUserSelect,
    orderBy: { name: "asc" },
  });
}

export async function getUserById(id: string): Promise<SafeUser | null> {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: safeUserSelect,
  });
}
