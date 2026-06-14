import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { confirmUpload } from "@/services/attachment.service";

export const POST = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const attachment = await confirmUpload(actor, id);
  return ok({ id: attachment.id, status: attachment.status });
});
