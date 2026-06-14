import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import type {
  CreateWebsiteInput,
  UpdateWebsiteInput,
} from "@/lib/validations/website";

/** Statuses that count as an "open" issue for dashboard counts. */
const OPEN_ISSUE_STATUSES: Prisma.EnumIssueStatusFilter["notIn"] = [
  "RESOLVED",
  "CLOSED",
];

function visibilityWhere(actor: SessionUser): Prisma.WebsiteWhereInput {
  // Managers see every site; clients see only the sites they own.
  return actor.role === "MANAGER"
    ? { deletedAt: null }
    : { deletedAt: null, clientId: actor.id };
}

export async function listWebsites(
  actor: SessionUser,
  opts: { page: number; pageSize: number },
) {
  const where = visibilityWhere(actor);
  const [websites, total] = await prisma.$transaction([
    prisma.website.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.website.count({ where }),
  ]);

  // Single grouped query for open-issue counts (avoids N+1).
  const counts = await prisma.issue.groupBy({
    by: ["websiteId"],
    where: {
      websiteId: { in: websites.map((w) => w.id) },
      deletedAt: null,
      status: { notIn: OPEN_ISSUE_STATUSES },
    },
    _count: { _all: true },
  });
  const countByWebsite = new Map(
    counts.map((c) => [c.websiteId, c._count._all]),
  );

  const items = websites.map((w) => ({
    ...w,
    openIssues: countByWebsite.get(w.id) ?? 0,
  }));
  return { items, total };
}

export async function getWebsite(actor: SessionUser, id: string) {
  const website = await prisma.website.findFirst({
    where: { id, deletedAt: null },
  });
  if (!website) throw Errors.notFound("Website not found");
  if (actor.role !== "MANAGER" && website.clientId !== actor.id) {
    throw Errors.forbidden();
  }
  const openIssues = await prisma.issue.count({
    where: { websiteId: id, deletedAt: null, status: { notIn: OPEN_ISSUE_STATUSES } },
  });
  return { ...website, openIssues };
}

/** Managers create websites and assign them to an owning client. */
export async function createWebsite(
  actor: SessionUser,
  input: CreateWebsiteInput,
) {
  if (actor.role !== "MANAGER") throw Errors.forbidden();
  const client = await prisma.user.findFirst({
    where: { id: input.clientId, role: "CLIENT", deletedAt: null },
  });
  if (!client) throw Errors.badRequest("Owner must be an existing client user");

  return prisma.website.create({
    data: { name: input.name, url: input.url, clientId: input.clientId },
  });
}

export async function updateWebsite(
  actor: SessionUser,
  id: string,
  input: UpdateWebsiteInput,
) {
  if (actor.role !== "MANAGER") throw Errors.forbidden();
  const website = await prisma.website.findFirst({
    where: { id, deletedAt: null },
  });
  if (!website) throw Errors.notFound("Website not found");

  return prisma.website.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.url !== undefined ? { url: input.url } : {}),
      ...(input.status !== undefined
        ? { status: input.status, lastCheckedAt: new Date() }
        : {}),
    },
  });
}
