import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";

export interface DashboardStats {
  totalIssues: number;
  open: number; // OPEN + IN_REVIEW + IN_PROGRESS
  waitingForClient: number;
  resolved30d: number;
  websites: number;
  byStatus: Record<string, number>;
  bySeverity: Record<string, number>;
}

/** RBAC scope: managers see all; clients see their reported / owned-site issues. */
function issueScope(actor: SessionUser): Prisma.IssueWhereInput {
  return actor.role === "MANAGER"
    ? { deletedAt: null }
    : {
        deletedAt: null,
        OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
      };
}

export async function getDashboardStats(
  actor: SessionUser,
): Promise<DashboardStats> {
  const where = issueScope(actor);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [total, statusGroups, severityGroups, websites, resolved30d] =
    await Promise.all([
      prisma.issue.count({ where }),
      prisma.issue.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.issue.groupBy({ by: ["severity"], where, _count: { _all: true } }),
      prisma.website.count({
        where:
          actor.role === "MANAGER"
            ? { deletedAt: null }
            : { deletedAt: null, clientId: actor.id },
      }),
      prisma.issue.count({
        where: { ...where, status: "RESOLVED", resolvedAt: { gte: since } },
      }),
    ]);

  const byStatus: Record<string, number> = {};
  for (const g of statusGroups) byStatus[g.status] = g._count._all;
  const bySeverity: Record<string, number> = {};
  for (const g of severityGroups) bySeverity[g.severity] = g._count._all;

  return {
    totalIssues: total,
    open:
      (byStatus.OPEN ?? 0) +
      (byStatus.IN_REVIEW ?? 0) +
      (byStatus.IN_PROGRESS ?? 0),
    waitingForClient: byStatus.WAITING_FOR_CLIENT ?? 0,
    resolved30d,
    websites,
    byStatus,
    bySeverity,
  };
}
