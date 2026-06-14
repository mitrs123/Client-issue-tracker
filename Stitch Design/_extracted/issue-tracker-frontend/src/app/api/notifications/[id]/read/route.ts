import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { markAsRead } from "@/services/notification.service";

export const POST = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const notification = await markAsRead(actor, id);
  return ok(notification);
});
