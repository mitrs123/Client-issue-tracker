import { Prisma, type IssueEventType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { features } from "@/lib/env";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { safeUserSelect } from "@/services/user.service";
import { recordIssueEvent } from "@/services/issue-event.service";
import { createNotification } from "@/services/notification.service";
import { triggerDispatch } from "@/services/notification-dispatch.service";
import type {
  CreateIssueInput,
  ListIssuesQuery,
  UpdateIssueSeverityInput,
  UpdateIssueStatusInput,
} from "@/lib/validations/issue";

const TERMINAL_STATUSES = ["RESOLVED", "CLOSED"] as const;

/** Generate the next human-friendly issue number (e.g. ISS-000123). */
async function generateIssueNo(tx: Prisma.TransactionClient): Promise<string> {
  const last = await tx.issue.findFirst({
    orderBy: { issueNo: "desc" },
    select: { issueNo: true },
  });
  const lastNum = last
    ? parseInt(last.issueNo.replace(/\D/g, ""), 10) || 0
    : 0;
  return `ISS-${String(lastNum + 1).padStart(6, "0")}`;
}

/** RBAC: managers see all; clients only their own reported / owned-site issues. */
function assertIssueAccess(
  actor: SessionUser,
  issue: { reporterId: string; website: { clientId: string } },
): void {
  if (actor.role === "MANAGER") return;
  if (issue.reporterId === actor.id || issue.website.clientId === actor.id) return;
  throw Errors.forbidden();
}

function humanize(value: string): string {
  return value.replace(/_/g, " ").toLowerCase();
}

export async function createIssue(actor: SessionUser, input: CreateIssueInput) {
  const website = await prisma.website.findFirst({
    where: { id: input.websiteId, deletedAt: null },
    select: { id: true, clientId: true },
  });
  if (!website) throw Errors.badRequest("Website not found");
  if (actor.role === "CLIENT" && website.clientId !== actor.id) {
    throw Errors.forbidden("You can only report issues for your own websites");
  }

  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        const issueNo = await generateIssueNo(tx);
        const issue = await tx.issue.create({
          data: {
            issueNo,
            websiteId: input.websiteId,
            reporterId: actor.id,
            title: input.title,
            description: input.description,
            type: input.type,
            severity: input.severity,
          },
        });
        await recordIssueEvent(tx, {
          issueId: issue.id,
          actorId: actor.id,
          type: "CREATED",
          message: `Issue reported by ${actor.name}`,
        });
        return issue;
      });
    } catch (err) {
      const isUniqueClash =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002";
      if (isUniqueClash && attempt < MAX_RETRIES - 1) continue;
      throw err;
    }
  }
  throw Errors.conflict("Could not allocate a unique issue number; please retry");
}

export async function getIssue(actor: SessionUser, id: string) {
  const issue = await prisma.issue.findFirst({
    where: { id, deletedAt: null },
    include: {
      website: {
        select: { id: true, name: true, url: true, status: true, clientId: true },
      },
      reporter: { select: safeUserSelect },
      assignedManager: { select: safeUserSelect },
      attachments: {
        where: { deletedAt: null, status: "UPLOADED" },
        orderBy: { createdAt: "asc" },
      },
      aiSuggestion: true,
      _count: { select: { comments: { where: { deletedAt: null } } } },
    },
  });
  if (!issue) throw Errors.notFound("Issue not found");
  assertIssueAccess(actor, issue);

  // AI suggestions are manager-facing only.
  if (actor.role !== "MANAGER") issue.aiSuggestion = null;
  return issue;
}

export async function listIssues(actor: SessionUser, query: ListIssuesQuery) {
  const filters: Prisma.IssueWhereInput[] = [{ deletedAt: null }];

  if (actor.role === "CLIENT") {
    filters.push({
      OR: [{ reporterId: actor.id }, { website: { clientId: actor.id } }],
    });
  }
  if (query.status) filters.push({ status: query.status });
  if (query.severity) filters.push({ severity: query.severity });
  if (query.type) filters.push({ type: query.type });
  if (query.websiteId) filters.push({ websiteId: query.websiteId });
  if (query.search) {
    filters.push({
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        { issueNo: { contains: query.search, mode: "insensitive" } },
        { website: { name: { contains: query.search, mode: "insensitive" } } },
        { reporter: { name: { contains: query.search, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.IssueWhereInput = { AND: filters };
  const [items, total] = await prisma.$transaction([
    prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        website: { select: { id: true, name: true, url: true, status: true } },
        reporter: { select: safeUserSelect },
        assignedManager: { select: safeUserSelect },
      },
    }),
    prisma.issue.count({ where }),
  ]);
  return { items, total };
}

export async function updateIssueStatus(
  actor: SessionUser,
  id: string,
  input: UpdateIssueStatusInput,
) {
  if (actor.role !== "MANAGER") throw Errors.forbidden();

  const issue = await prisma.issue.findFirst({
    where: { id, deletedAt: null },
    include: { website: { select: { clientId: true } } },
  });
  if (!issue) throw Errors.notFound("Issue not found");
  if (issue.status === input.status) return issue;

  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const data: Prisma.IssueUpdateInput = { status: input.status };
    let eventType: IssueEventType = "STATUS_CHANGED";

    const wasTerminal = (TERMINAL_STATUSES as readonly string[]).includes(
      issue.status,
    );
    if (input.status === "RESOLVED") {
      data.resolvedAt = now;
      eventType = "RESOLVED";
    } else if (input.status === "CLOSED") {
      data.closedAt = now;
      eventType = "CLOSED";
    } else if (wasTerminal) {
      data.resolvedAt = null;
      data.closedAt = null;
      eventType = "REOPENED";
    }

    const updated = await tx.issue.update({ where: { id }, data });
    await recordIssueEvent(tx, {
      issueId: id,
      actorId: actor.id,
      type: eventType,
      fromValue: issue.status,
      toValue: input.status,
      message: input.note ?? null,
    });

    // Notify the reporting client (skip if the manager is also the reporter).
    if (issue.reporterId !== actor.id) {
      if (input.status === "RESOLVED") {
        const payload = {
          userId: issue.reporterId,
          issueId: id,
          type: "ISSUE_RESOLVED" as const,
          title: `Issue ${issue.issueNo} resolved`,
          body: `Your issue "${issue.title}" has been marked as resolved.`,
        };
        // In-app (delivered immediately) + queued email/push (background).
        await createNotification(tx, payload);
        if (features.smtp)
          await createNotification(tx, { ...payload, channel: "EMAIL" });
        if (features.push)
          await createNotification(tx, { ...payload, channel: "PUSH" });
      } else {
        await createNotification(tx, {
          userId: issue.reporterId,
          issueId: id,
          type: "ISSUE_STATUS_CHANGED",
          title: `Issue ${issue.issueNo} updated`,
          body: `Status changed to ${humanize(input.status)}.`,
        });
      }
    }
    return updated;
  });

  // Best-effort background dispatch of any queued email/push (non-blocking).
  if (
    input.status === "RESOLVED" &&
    issue.reporterId !== actor.id &&
    (features.smtp || features.push)
  ) {
    triggerDispatch();
  }
  return result;
}

export async function updateIssueSeverity(
  actor: SessionUser,
  id: string,
  input: UpdateIssueSeverityInput,
) {
  if (actor.role !== "MANAGER") throw Errors.forbidden();

  const issue = await prisma.issue.findFirst({
    where: { id, deletedAt: null },
    include: { website: { select: { clientId: true } } },
  });
  if (!issue) throw Errors.notFound("Issue not found");
  if (issue.severity === input.severity) return issue;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.issue.update({
      where: { id },
      data: { severity: input.severity },
    });
    await recordIssueEvent(tx, {
      issueId: id,
      actorId: actor.id,
      type: "SEVERITY_CHANGED",
      fromValue: issue.severity,
      toValue: input.severity,
      message: input.note ?? null,
    });
    if (issue.reporterId !== actor.id) {
      await createNotification(tx, {
        userId: issue.reporterId,
        issueId: id,
        type: "ISSUE_SEVERITY_CHANGED",
        title: `Issue ${issue.issueNo} severity updated`,
        body: `Severity changed to ${humanize(input.severity)}.`,
      });
    }
    return updated;
  });
}

export async function getIssueTimeline(
  actor: SessionUser,
  id: string,
  preloadedIssue?: { reporterId: string; website: { clientId: string } } | null,
) {
  if (preloadedIssue) {
    assertIssueAccess(actor, preloadedIssue);
  } else {
    const issue = await prisma.issue.findFirst({
      where: { id, deletedAt: null },
      include: { website: { select: { clientId: true } } },
    });
    if (!issue) throw Errors.notFound("Issue not found");
    assertIssueAccess(actor, issue);
  }

  return prisma.issueEvent.findMany({
    where: { issueId: id, deletedAt: null },
    orderBy: { createdAt: "asc" },
    include: { actor: { select: safeUserSelect } },
  });
}
