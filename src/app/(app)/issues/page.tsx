import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { listIssues } from "@/services/issue.service";
import { listIssuesQuerySchema } from "@/lib/validations/issue";
import { IssuesFilters } from "@/components/issues-filters";
import { IssueStatusBadge, IssueTypeBadge, SeverityDot } from "@/components/badges";
import { IssueRow } from "@/components/issue-row";
import { Icon } from "@/components/icon";
import { initials, timeAgo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function IssuesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");

  const raw = await searchParams;
  const parsed = listIssuesQuerySchema.safeParse(raw);
  const query = parsed.success ? parsed.data : listIssuesQuerySchema.parse({});

  const [{ items, total }, activeCount, unassignedCount, resolvedIssues, totalCount, closedOrResolvedCount] = await Promise.all([
    listIssues(actor, query),
    prisma.issue.count({
      where: actor.role === "MANAGER"
        ? { deletedAt: null, status: { notIn: ["RESOLVED", "CLOSED"] } }
        : {
            deletedAt: null,
            status: { notIn: ["RESOLVED", "CLOSED"] },
            OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
          },
    }),
    prisma.issue.count({
      where: actor.role === "MANAGER"
        ? { deletedAt: null, assignedManagerId: null, status: { notIn: ["RESOLVED", "CLOSED"] } }
        : {
            deletedAt: null,
            assignedManagerId: null,
            status: { notIn: ["RESOLVED", "CLOSED"] },
            OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
          },
    }),
    prisma.issue.findMany({
      where: actor.role === "MANAGER"
        ? { deletedAt: null, status: "RESOLVED", resolvedAt: { not: null } }
        : {
            deletedAt: null,
            status: "RESOLVED",
            resolvedAt: { not: null },
            OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
          },
      select: { createdAt: true, resolvedAt: true },
    }),
    prisma.issue.count({
      where: actor.role === "MANAGER"
        ? { deletedAt: null }
        : {
            deletedAt: null,
            OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
          },
    }),
    prisma.issue.count({
      where: actor.role === "MANAGER"
        ? { deletedAt: null, status: { in: ["RESOLVED", "CLOSED"] } }
        : {
            deletedAt: null,
            status: { in: ["RESOLVED", "CLOSED"] },
            OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
          },
    }),
  ]);

  let avgDaysStr = "1.4d";
  if (resolvedIssues.length > 0) {
    const totalMs = resolvedIssues.reduce((sum, issue) => {
      return sum + (issue.resolvedAt!.getTime() - issue.createdAt.getTime());
    }, 0);
    const avgDays = totalMs / (1000 * 60 * 60 * 24 * resolvedIssues.length);
    avgDaysStr = `${avgDays.toFixed(1)}d`;
  }

  const successRateStr = totalCount > 0
    ? `${((closedOrResolvedCount / totalCount) * 100).toFixed(1)}%`
    : "100.0%";
  const from = total === 0 ? 0 : (query.page - 1) * query.pageSize + 1;
  const to = Math.min(query.page * query.pageSize, total);
  const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

  function pageHref(page: number) {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries(raw)) {
      if (typeof v === "string") next.set(k, v);
    }
    next.set("page", String(page));
    return `/issues?${next.toString()}`;
  }

  return (
    <div className="space-y-4 p-4 md:p-5 lg:p-6 mx-auto max-w-7xl">
      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">

        <IssuesFilters />
        <span className="font-label-md text-label-md text-on-surface-variant">
          {total === 0 ? "No issues" : `Displaying ${from}-${to} of ${total}`}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <Icon name="error_outline" className="text-[40px] text-on-surface-variant opacity-40" />
            <p className="font-body-md text-on-surface-variant">
              No issues match your filters.
            </p>
            <Link href="/issues/new" className="font-label-md font-bold text-tertiary hover:underline">
              Report an issue
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-outline-variant/10 bg-surface-container-low">
                  {["Issue #", "Title", "Type", "Severity", "Status", "Reporter"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-md py-4 font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
                      >
                        {h}
                      </th>
                    ),
                  )}
                  <th className="px-md py-4 text-right font-label-md text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {items.map((issue) => (
                  <IssueRow key={issue.id} id={issue.id}>
                    <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                      <Link href={`/issues/${issue.id}`}>{issue.issueNo}</Link>
                    </td>
                    <td className="px-md py-4">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="font-label-md text-label-md font-semibold text-on-surface transition-colors group-hover:text-tertiary"
                      >
                        {issue.title}
                      </Link>
                    </td>
                    <td className="px-md py-4">
                      <IssueTypeBadge type={issue.type} />
                    </td>
                    <td className="px-md py-4">
                      <SeverityDot severity={issue.severity} />
                    </td>
                    <td className="px-md py-4">
                      <IssueStatusBadge status={issue.status} />
                    </td>
                    <td className="px-md py-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-on-secondary">
                          {initials(issue.reporter.name)}
                        </span>
                        <span className="font-label-md text-label-md text-on-surface">
                          {issue.reporter.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-md py-4 text-right font-label-md text-label-md text-on-surface-variant">
                      {timeAgo(new Date(issue.updatedAt).toISOString())}
                    </td>
                  </IssueRow>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          {query.page > 1 && (
            <Link
              href={pageHref(query.page - 1)}
              className="flex items-center gap-1 rounded-lg border border-outline-variant/20 px-4 py-2 font-label-md text-label-md transition-colors hover:bg-surface-container-high"
            >
              <Icon name="chevron_left" className="text-[18px]" /> Previous
            </Link>
          )}
          <span className="px-2 font-label-md text-label-md text-on-surface-variant">
            Page {query.page} of {totalPages}
          </span>
          {query.page < totalPages && (
            <Link
              href={pageHref(query.page + 1)}
              className="flex items-center gap-1 rounded-lg border border-outline-variant/20 px-4 py-2 font-label-md text-label-md transition-colors hover:bg-surface-container-high"
            >
              Next <Icon name="chevron_right" className="text-[18px]" />
            </Link>
          )}
        </div>
      )}

      {/* Stats Overview Cards (Bento-lite) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl">

          <p className="font-label-md text-label-md text-on-surface-variant mb-1">Active Issues</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-md font-bold text-on-surface">{activeCount}</h3>
            <span className="text-green-500 font-label-md text-[12px] mb-1 flex items-center">
              <Icon name="arrow_downward" className="text-[14px]" />
              12%
            </span>
          </div>
        </div>
        <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl">
          <p className="font-label-md text-label-md text-on-surface-variant mb-1">Unassigned</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-md font-bold text-on-surface">
              {String(unassignedCount).padStart(2, "0")}
            </h3>
            <span className="text-tertiary font-label-md text-[12px] mb-1 flex items-center">
              <Icon name="warning" className="text-[14px]" />
              Urgent
            </span>
          </div>
        </div>
        <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl">
          <p className="font-label-md text-label-md text-on-surface-variant mb-1">Avg Resolution</p>
          <div className="flex items-end justify-between">
            <h3 className="text-headline-md font-bold text-on-surface">{avgDaysStr}</h3>
            <span className="text-on-surface-variant font-label-md text-[12px] mb-1">Stable</span>
          </div>
        </div>
        <div className="p-4 bg-tertiary/5 border border-tertiary/20 rounded-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="font-label-md text-label-md text-tertiary mb-1">Success Rate</p>
            <h3 className="text-headline-md font-bold text-[#1c1b1b]">{successRateStr}</h3>
          </div>
          <Icon
            name="check_circle"
            className="absolute -right-4 -bottom-4 text-[80px] opacity-10 text-tertiary transform group-hover:scale-110 transition-transform duration-500"
            fill
          />
        </div>
      </div>
    </div>
  );
}
