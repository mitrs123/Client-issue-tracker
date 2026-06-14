import { handle } from "@/lib/route-handler";
import { ok, paginationMeta } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import {
  paginationSchema,
  searchParamsToObject,
} from "@/lib/validations/common";
import { listNotifications } from "@/services/notification.service";

export const GET = handle(async (req) => {
  const actor = await requireUser();
  const { page, pageSize } = paginationSchema.parse(
    searchParamsToObject(req.nextUrl.searchParams),
  );
  const unreadOnly = req.nextUrl.searchParams.get("unreadOnly") === "true";
  const { items, total, unread } = await listNotifications(actor, {
    page,
    pageSize,
    unreadOnly,
  });
  return ok(items, {
    meta: { ...paginationMeta(total, page, pageSize), unread },
  });
});
