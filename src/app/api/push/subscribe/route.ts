import { z } from "zod";
import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { prisma } from "@/lib/prisma";
import { isPushEnabled } from "@/lib/push";

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
  userAgent: z.string().optional(),
});

export const POST = handle(async (req) => {
  const actor = await requireUser();
  if (!isPushEnabled()) {
    throw Errors.featureDisabled("Push notifications are not configured");
  }
  const body = await req.json().catch(() => ({}));
  const input = subscribeSchema.parse(body);

  const sub = await prisma.pushSubscription.upsert({
    where: { endpoint: input.endpoint },
    create: {
      userId: actor.id,
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    },
    update: {
      userId: actor.id,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      deletedAt: null,
    },
  });
  return ok({ id: sub.id }, { status: 201 });
});
