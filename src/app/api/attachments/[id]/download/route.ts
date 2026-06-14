import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getDownloadUrl } from "@/services/attachment.service";

export const GET = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const result = await getDownloadUrl(actor, id);
  return ok(result);
});
