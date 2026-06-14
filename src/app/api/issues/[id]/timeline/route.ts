import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getIssueTimeline } from "@/services/issue.service";

export const GET = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const timeline = await getIssueTimeline(actor, id);
  return ok(timeline);
});
