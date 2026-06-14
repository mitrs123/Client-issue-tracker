import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations/comment";
import { addComment, listComments } from "@/services/comment.service";
import { enforceRateLimit } from "@/lib/rate-limit";

export const GET = handle<{ id: string }>(async (_req, ctx) => {
  const actor = await requireUser();
  const { id } = await ctx.params;
  const comments = await listComments(actor, id);
  return ok(comments);
});

export const POST = handle<{ id: string }>(async (req, ctx) => {
  // Spam guard: 60 comments per minute per client IP.
  enforceRateLimit(req, { name: "comments:create", limit: 60, windowMs: 60_000 });
  const actor = await requireUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const input = createCommentSchema.parse(body);
  const comment = await addComment(actor, id, input);
  return ok(comment, { status: 201 });
});
