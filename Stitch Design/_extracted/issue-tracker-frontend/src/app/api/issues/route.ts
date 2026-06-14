import { handle } from "@/lib/route-handler";
import { ok, paginationMeta } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { searchParamsToObject } from "@/lib/validations/common";
import {
  createIssueSchema,
  listIssuesQuerySchema,
} from "@/lib/validations/issue";
import { createIssue, listIssues } from "@/services/issue.service";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = handle(async (req) => {
  const actor = await requireUser();
  const query = listIssuesQuerySchema.parse(
    searchParamsToObject(req.nextUrl.searchParams),
  );
  const { items, total } = await listIssues(actor, query);
  return ok(items, {
    meta: paginationMeta(total, query.page, query.pageSize),
  });
});

export const POST = handle(async (req) => {
  // Spam guard: 30 new issues per minute per client IP.
  enforceRateLimit(req, { name: "issues:create", limit: 30, windowMs: 60_000 });
  const actor = await requireUser();
  const body = await req.json().catch(() => ({}));
  const input = createIssueSchema.parse(body);
  const issue = await createIssue(actor, input);
  return ok(issue, { status: 201 });
});
