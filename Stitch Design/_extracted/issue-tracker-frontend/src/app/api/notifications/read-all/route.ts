import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { markAllAsRead } from "@/services/notification.service";

export const POST = handle(async () => {
  const actor = await requireUser();
  const count = await markAllAsRead(actor);
  return ok({ updated: count });
});
