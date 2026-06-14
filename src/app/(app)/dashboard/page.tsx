import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getDashboardStats } from "@/services/dashboard.service";
import { listIssues } from "@/services/issue.service";
import { Icon } from "@/components/icon";
import { SeverityBadge } from "@/components/badges";
import { formatEnum, timeAgo } from "@/lib/format";
import type { IssueSeverity } from "@/lib/types";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const SEVERITY_RING: { key: IssueSeverity; color: string; chip: string }[] = [
  { key: "CRITICAL", color: "#ef4444", chip: "bg-red-500" },
  { key: "HIGH", color: "#f97316", chip: "bg-orange-500" },
  { key: "MEDIUM", color: "#3b82f6", chip: "bg-blue-500" },
  { key: "LOW", color: "#cbd5e1", chip: "bg-slate-300" },
];

export default async function DashboardPage() {
  const actor = await getSessionUser();
  if (!actor) redirect("/login");

  const [stats, recent, recentEvents] = await Promise.all([
    getDashboardStats(actor),
    listIssues(actor, { page: 1, pageSize: 5 }),
    prisma.issueEvent.findMany({
      where: actor.role === "MANAGER"
        ? { deletedAt: null }
        : {
            deletedAt: null,
            issue: {
              OR: [
                { reporterId: actor.id },
                { website: { clientId: actor.id } },
              ],
            },
          },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        actor: { select: { name: true, role: true } },
        issue: {
          select: {
            id: true,
            issueNo: true,
            title: true,
          },
        },
      },
    }),
  ]);

  const cards = [
    { label: "Total Issues", value: stats.totalIssues, icon: "analytics", tint: "text-primary" },
    { label: "Open", value: stats.open, icon: "pending", tint: "text-tertiary" },
    { label: "Waiting For Client", value: stats.waitingForClient, icon: "hourglass_empty", tint: "text-secondary" },
    { label: "Resolved 30d", value: stats.resolved30d, icon: "task_alt", tint: "text-green-600" },
  ];

  const severityTotal = SEVERITY_RING.reduce(
    (sum, s) => sum + (stats.bySeverity[s.key] ?? 0),
    0,
  );
  let acc = 0;
  const ringStops = SEVERITY_RING.map((s) => {
    const pct = severityTotal ? ((stats.bySeverity[s.key] ?? 0) / severityTotal) * 100 : 0;
    const seg = `${s.color} ${acc}% ${acc + pct}%`;
    acc += pct;
    return seg;
  });
  const ring =
    severityTotal > 0
      ? `conic-gradient(${ringStops.join(", ")})`
      : "conic-gradient(#f1edec 0% 100%)";

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-5 lg:p-6">
      <section className="mb-5">
        <h2 className="text-[28px] md:text-[36px] font-bold leading-tight tracking-tight text-on-surface">
          Welcome back, {actor.name.split(" ")[0]}
        </h2>
        <p className="mt-1 text-body-md text-on-surface-variant">
          Here&apos;s a summary of your organization&apos;s performance today.
        </p>
      </section>


      {/* Stat cards */}
      <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="mb-3 flex items-start justify-between">
              <span className={`rounded-lg bg-surface-container p-2 ${c.tint}`}>
                <Icon name={c.icon} />
              </span>
            </div>
            <p className="font-label-md text-label-md text-on-surface-variant">
              {c.label}
            </p>
            <p className="mt-1 font-headline-md text-[24px] font-bold">{c.value}</p>
          </div>
        ))}
      </section>

      {/* Recent issues + severity breakdown */}
      <section className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-headline-md text-[20px] font-bold text-on-surface">
              Recent Issues
            </h3>
            <Link
              href="/issues"
              className="font-label-md font-bold text-tertiary hover:underline"
            >
              View All
            </Link>
          </div>
          {recent.items.length === 0 ? (
            <EmptyRow />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant">ID</th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant">Title</th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant">Severity</th>
                    <th className="pb-3 font-label-md text-label-md text-on-surface-variant">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {recent.items.map((issue) => (
                    <tr key={issue.id} className="transition-colors hover:bg-surface-container/30">
                      <td className="py-3 font-label-md">
                        <Link href={`/issues/${issue.id}`} className="hover:text-tertiary">
                          #{issue.issueNo}
                        </Link>
                      </td>
                      <td className="py-3 font-body-md font-medium text-secondary">
                        <Link href={`/issues/${issue.id}`} className="hover:text-tertiary">
                          {issue.title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <SeverityBadge severity={issue.severity} />
                      </td>
                      <td className="py-3">
                        <span className="font-label-md text-on-surface-variant">
                          {formatEnum(issue.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col items-center rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
          <h3 className="mb-4 w-full font-headline-md text-[20px] font-bold text-on-surface">
            Severity Breakdown
          </h3>
          <div
            className="relative mb-4 flex h-40 w-40 items-center justify-center rounded-full"
            style={{ background: ring }}
          >
            <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-surface-container-lowest">
              <span className="font-headline-md text-[24px] font-bold text-on-surface">{severityTotal}</span>
              <span className="text-[9px] uppercase text-on-surface-variant font-bold">Total</span>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-3">
            {SEVERITY_RING.map((s) => {
              const count = stats.bySeverity[s.key] ?? 0;
              const pct = severityTotal ? Math.round((count / severityTotal) * 100) : 0;
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span className={`h-3 w-3 rounded-sm ${s.chip}`} />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-on-surface-variant">
                      {formatEnum(s.key)}
                    </p>
                    <p className="font-label-md font-bold">{pct}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom Section: Recent Activity Timeline */}
      <section className="mt-6 max-w-4xl">
        <div className="mb-md flex items-center justify-between">
          <h3 className="font-headline-md text-[24px] text-on-surface">
            Recent Activity
          </h3>
          <div className="flex items-center gap-2 font-label-md text-on-surface-variant">
            <Icon name="history" className="text-[18px]" />
            Last updated just now
          </div>
        </div>

        {recentEvents.length === 0 ? (
          <p className="font-body-md text-on-surface-variant">No recent activity.</p>
        ) : (
          <div className="space-y-0 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/20">
            {recentEvents.map((event) => {
              const config = EVENT_CONFIG[event.type] || {
                icon: "history",
                bg: "bg-surface-container",
                text: "text-on-surface-variant",
              };
              return (
                <div key={event.id} className="relative pl-10 pb-10 last:pb-0">
                  <div className={cn(
                    "absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center z-10",
                    config.bg
                  )}>
                    <Icon
                      name={config.icon}
                      className={cn("text-[18px]", config.text)}
                      fill={config.fill}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                      {renderEventContent(event)}
                    </div>
                    <p className="font-label-md text-label-md text-on-surface-variant opacity-60">
                      {timeAgo(event.createdAt.toISOString())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

const EVENT_CONFIG: Record<
  string,
  { icon: string; bg: string; text: string; fill?: boolean }
> = {
  CREATED: { icon: "add_circle", bg: "bg-tertiary/10", text: "text-tertiary" },
  STATUS_CHANGED: { icon: "sync", bg: "bg-blue-100", text: "text-blue-700" },
  SEVERITY_CHANGED: { icon: "priority_high", bg: "bg-orange-100", text: "text-orange-700" },
  RESOLVED: { icon: "check_circle", bg: "bg-green-100", text: "text-green-700", fill: true },
  CLOSED: { icon: "check_circle", bg: "bg-green-100", text: "text-green-700", fill: true },
  COMMENT_ADDED: { icon: "chat_bubble", bg: "bg-amber-100", text: "text-amber-700" },
  RESPONSE_ADDED: { icon: "chat_bubble", bg: "bg-amber-100", text: "text-amber-700" },
  ASSIGNED: { icon: "add_task", bg: "bg-tertiary/10", text: "text-tertiary" },
};

interface DashboardEvent {
  type: string;
  toValue: string | null;
  actor: { name: string } | null;
  issue: { id: string; issueNo: string };
}

function renderEventContent(e: DashboardEvent) {
  const actorName = e.actor?.name ?? "System";
  const issueLink = (
    <Link href={`/issues/${e.issue.id}`} className="font-bold text-secondary hover:text-tertiary hover:underline">
      #{e.issue.issueNo}
    </Link>
  );

  switch (e.type) {
    case "CREATED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> reported issue </span>
          {issueLink}
        </>
      );
    case "STATUS_CHANGED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> updated status of </span>
          {issueLink}
          <span className="text-on-surface-variant font-body-md"> to </span>
          <span className="font-label-md font-bold text-secondary">{formatEnum(e.toValue ?? "")}</span>
        </>
      );
    case "SEVERITY_CHANGED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> updated severity of </span>
          {issueLink}
          <span className="text-on-surface-variant font-body-md"> to </span>
          <span className="font-label-md font-bold text-secondary">{formatEnum(e.toValue ?? "")}</span>
        </>
      );
    case "ASSIGNED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> assigned issue </span>
          {issueLink}
          <span className="text-on-surface-variant font-body-md"> to </span>
          <span className="font-label-md font-bold text-secondary">{e.toValue ?? "manager"}</span>
        </>
      );
    case "COMMENT_ADDED":
    case "RESPONSE_ADDED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> commented on </span>
          {issueLink}
        </>
      );
    case "RESOLVED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">Issue </span>
          {issueLink}
          <span className="text-on-surface-variant font-body-md"> marked as resolved by </span>
          <span className="font-label-md font-bold text-secondary">{actorName}</span>
        </>
      );
    case "CLOSED":
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">Issue </span>
          {issueLink}
          <span className="text-on-surface-variant font-body-md"> marked as closed by </span>
          <span className="font-label-md font-bold text-secondary">{actorName}</span>
        </>
      );
    default:
      return (
        <>
          <span className="font-label-md font-bold text-on-surface">{actorName}</span>
          <span className="text-on-surface-variant font-body-md"> · {formatEnum(e.type)} on </span>
          {issueLink}
        </>
      );
  }
}

function EmptyRow() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Icon name="inbox" className="text-[40px] text-on-surface-variant opacity-40" />
      <p className="font-body-md text-on-surface-variant">No issues yet.</p>
      <Link
        href="/issues/new"
        className="font-label-md font-bold text-tertiary hover:underline"
      >
        Report your first issue
      </Link>
    </div>
  );
}
