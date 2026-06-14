import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { safeUserSelect } from "@/services/user.service";
import { recordIssueEvent } from "@/services/issue-event.service";
import { createNotification } from "@/services/notification.service";
import type { CreateCommentInput } from "@/lib/validations/comment";

/** Loads an issue the actor may access, or throws. Returns full issue scalars. */
async function loadAccessibleIssue(actor: SessionUser, issueId: string) {
  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
    include: { website: { select: { clientId: true } } },
  });
  if (!issue) throw Errors.notFound("Issue not found");
  if (
    actor.role !== "MANAGER" &&
    issue.reporterId !== actor.id &&
    issue.website.clientId !== actor.id
  ) {
    throw Errors.forbidden();
  }
  return issue;
}

export async function listComments(actor: SessionUser, issueId: string) {
  await loadAccessibleIssue(actor, issueId);
  return prisma.comment.findMany({
    where: {
      issueId,
      deletedAt: null,
      // Clients never see manager-only internal notes.
      ...(actor.role === "MANAGER" ? {} : { isInternal: false }),
    },
    orderBy: { createdAt: "asc" },
    include: { author: { select: safeUserSelect } },
  });
}

export async function addComment(
  actor: SessionUser,
  issueId: string,
  input: CreateCommentInput,
) {
  const issue = await loadAccessibleIssue(actor, issueId);
  const actingAsManager = actor.role === "MANAGER";
  // Only managers can post internal notes.
  const isInternal = actingAsManager ? input.isInternal === true : false;

  return prisma.$transaction(async (tx) => {
    const comment = await tx.comment.create({
      data: { issueId, authorId: actor.id, body: input.body, isInternal },
    });

    await recordIssueEvent(tx, {
      issueId,
      actorId: actor.id,
      type: actingAsManager ? "RESPONSE_ADDED" : "COMMENT_ADDED",
      message: isInternal ? "Internal note added" : null,
      metadata: { commentId: comment.id, isInternal },
    });

    if (!isInternal) {
      const preview = input.body.slice(0, 140);
      if (actingAsManager && issue.reporterId !== actor.id) {
        // Manager responded → notify the client.
        await createNotification(tx, {
          userId: issue.reporterId,
          issueId,
          type: "ISSUE_RESPONSE",
          title: `New response on ${issue.issueNo}`,
          body: preview,
        });
      } else if (
        !actingAsManager &&
        issue.assignedManagerId &&
        issue.assignedManagerId !== actor.id
      ) {
        // Client commented → notify the assigned manager (if any).
        await createNotification(tx, {
          userId: issue.assignedManagerId,
          issueId,
          type: "ISSUE_COMMENT",
          title: `New comment on ${issue.issueNo}`,
          body: preview,
        });
      }
    }
    return comment;
  });
}
