import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { updateIssueStatusSchema } from "@/lib/validations/issue";
import { updateIssueStatus } from "@/services/issue.service";
import { enforceRateLimit } from "@/lib/rate-limit";

export const PATCH = handle<{ id: string }>(async (req, ctx) => {
  // Rate limited before auth so floods are throttled cheaply: 30/min per IP.
  enforceRateLimit(req, { name: "issues:status", limit: 30, windowMs: 60_000 });
  const actor = await requireRole("MANAGER");
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const input = updateIssueStatusSchema.parse(body);
  const issue = await updateIssueStatus(actor, id, input);
  return ok(issue);
});
