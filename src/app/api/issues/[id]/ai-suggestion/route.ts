import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { requireRole } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { generateIssueSuggestion } from "@/services/ai.service";

export const POST = handle<{ id: string }>(async (req, ctx) => {
  // AI calls are expensive — limit to 10/min per IP.
  enforceRateLimit(req, { name: "ai:generate", limit: 10, windowMs: 60_000 });
  const actor = await requireRole("MANAGER");
  const { id } = await ctx.params;
  const suggestion = await generateIssueSuggestion(actor, id);
  return ok(suggestion);
});
