import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { getIssue } from "@/services/issue.service";

export const GET = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const issue = await getIssue(actor, id);
  return ok(issue);
});
