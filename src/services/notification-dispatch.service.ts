import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isEmailEnabled, sendEmail } from "@/lib/mailer";
import { isPushEnabled, sendPush } from "@/lib/push";
import { logger } from "@/lib/logger";

/**
 * Background dispatcher for out-of-band notification channels (EMAIL, PUSH).
 * In-app notifications are delivered synchronously on creation; email/push rows
 * are queued as PENDING and processed here so they never block the API
 * response (Master Plan §3.3). Idempotent + retry-safe via attempts/status.
 *
 * Invoked best-effort after a triggering event AND by a cron-hit dispatch
 * endpoint, so delivery is reliable even in a serverless environment.
 */
const MAX_ATTEMPTS = 3;

type PendingNotification = Prisma.NotificationGetPayload<{
  include: { user: { select: { email: true } } };
}>;

export async function dispatchPendingNotifications(
  limit = 25,
): Promise<{ processed: number }> {
  const pending = await prisma.notification.findMany({
    where: {
      deletedAt: null,
      channel: { in: ["EMAIL", "PUSH"] },
      status: { in: ["PENDING", "RETRYING"] },
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    include: { user: { select: { email: true } } },
  });

  for (const n of pending) await dispatchOne(n);
  return { processed: pending.length };
}

async function dispatchOne(n: PendingNotification): Promise<void> {
  try {
    if (n.channel === "EMAIL") {
      if (!isEmailEnabled()) return void markFailed(n.id, "email disabled");
      await sendEmail({ to: n.user.email, subject: n.title, text: n.body });
    } else if (n.channel === "PUSH") {
      if (!isPushEnabled()) return void markFailed(n.id, "push disabled");
      const subs = await prisma.pushSubscription.findMany({
        where: { userId: n.userId, deletedAt: null },
      });
      const url = n.issueId ? `/issues/${n.issueId}` : "/notifications";
      await Promise.allSettled(
        subs.map((s) =>
          sendPush(
            { endpoint: s.endpoint, p256dh: s.p256dh, auth: s.auth },
            { title: n.title, body: n.body, url },
          ),
        ),
      );
    }
    await prisma.notification.update({
      where: { id: n.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
        deliveredAt: new Date(),
        attempts: { increment: 1 },
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const attempts = n.attempts + 1;
    await prisma.notification.update({
      where: { id: n.id },
      data: {
        status: attempts >= MAX_ATTEMPTS ? "FAILED" : "RETRYING",
        attempts,
        failedAt: new Date(),
        lastError: message,
      },
    });
    logger.warn("Notification dispatch failed", {
      id: n.id,
      channel: n.channel,
      attempts,
      error: message,
    });
  }
}

async function markFailed(id: string, reason: string): Promise<void> {
  await prisma.notification.update({
    where: { id },
    data: { status: "FAILED", failedAt: new Date(), lastError: reason },
  });
}

/** Fire-and-forget trigger used right after a triggering event. */
export function triggerDispatch(): void {
  void dispatchPendingNotifications().catch((err) => {
    logger.warn("Background dispatch trigger failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  });
}
