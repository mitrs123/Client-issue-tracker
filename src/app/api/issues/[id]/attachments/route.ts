import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { presignUploadSchema } from "@/lib/validations/attachment";
import { createUploadUrl } from "@/services/attachment.service";

export const POST = handle<{ id: string }>(async (req, ctx) => {
  enforceRateLimit(req, { name: "attachments:presign", limit: 30, windowMs: 60_000 });
  const actor = await requireUser();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const input = presignUploadSchema.parse(body);
  const result = await createUploadUrl(actor, id, input);
  return ok(result, { status: 201 });
});
