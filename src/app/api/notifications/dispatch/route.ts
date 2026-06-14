import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { getSessionUser } from "@/lib/auth";
import { Errors } from "@/lib/errors";
import { env } from "@/lib/env";
import { dispatchPendingNotifications } from "@/services/notification-dispatch.service";

/**
 * Processes queued email/push notifications. Intended for a cron job
 * (`Authorization: Bearer <CRON_SECRET>`); also callable by a signed-in manager.
 */
export const POST = handle(async (req) => {
  const auth = req.headers.get("authorization");
  const cronAuthorized =
    Boolean(env.CRON_SECRET) && auth === `Bearer ${env.CRON_SECRET}`;

  if (!cronAuthorized) {
    const user = await getSessionUser();
    if (!user || user.role !== "MANAGER") throw Errors.unauthorized();
  }

  const result = await dispatchPendingNotifications();
  return ok(result);
});
