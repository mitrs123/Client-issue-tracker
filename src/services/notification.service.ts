import {
  Prisma,
  type NotificationChannel,
  type NotificationType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  issueId?: string | null;
  channel?: NotificationChannel;
}

/**
 * Create a notification. In-app notifications are "delivered" immediately (the
 * row IS the in-app notification). Email/push are enqueued as PENDING and
 * dispatched by the background worker (Phase 4). Accepts a tx client so it can
 * be created atomically alongside the triggering change.
 */
export function createNotification(
  db: Prisma.TransactionClient,
  input: CreateNotificationInput,
) {
  const channel: NotificationChannel = input.channel ?? "IN_APP";
  const inApp = channel === "IN_APP";
  const now = new Date();
  return db.notification.create({
    data: {
      userId: input.userId,
      issueId: input.issueId ?? null,
      type: input.type,
      title: input.title,
      body: input.body,
      channel,
      status: inApp ? "DELIVERED" : "PENDING",
      sentAt: inApp ? now : null,
      deliveredAt: inApp ? now : null,
    },
  });
}

export async function listNotifications(
  actor: SessionUser,
  opts: { page: number; pageSize: number; unreadOnly?: boolean },
) {
  const where: Prisma.NotificationWhereInput = {
    userId: actor.id,
    deletedAt: null,
    ...(opts.unreadOnly ? { readAt: null } : {}),
  };
  const [items, total, unread] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId: actor.id, deletedAt: null, readAt: null },
    }),
  ]);
  return { items, total, unread };
}

export async function unreadCount(actor: SessionUser): Promise<number> {
  return prisma.notification.count({
    where: { userId: actor.id, deletedAt: null, readAt: null },
  });
}

export async function markAsRead(actor: SessionUser, id: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });
  if (!notification) throw Errors.notFound("Notification not found");
  if (notification.userId !== actor.id) throw Errors.forbidden();
  if (notification.readAt) return notification;
  return prisma.notification.update({
    where: { id },
    data: { readAt: new Date() },
  });
}

export async function markAllAsRead(actor: SessionUser): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId: actor.id, deletedAt: null, readAt: null },
    data: { readAt: new Date() },
  });
  return result.count;
}
