import { generateObject } from "ai";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { resolveAiModel } from "@/lib/ai";
import { recordIssueEvent } from "@/services/issue-event.service";
import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { SessionUser } from "@/lib/auth";

/**
 * Single structured AI call that extracts every field at once (Master Plan
 * §3.1). Output is SUGGESTION-ONLY — a manager reviews/edits before applying.
 */
const suggestionSchema = z.object({
  suggestedTitle: z.string().describe("A clear, concise issue title"),
  suggestedCategory: z.enum(["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"]),
  suggestedSeverity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  suggestedStatus: z
    .enum([
      "OPEN",
      "IN_REVIEW",
      "IN_PROGRESS",
      "WAITING_FOR_CLIENT",
      "RESOLVED",
      "CLOSED",
    ])
    .describe("The most appropriate workflow status for this issue right now"),
  enhancedDescription: z
    .string()
    .describe("A cleaned-up, well-structured version of the description"),
  summary: z.string().describe("A one or two sentence summary"),
  recommendedActions: z
    .string()
    .describe("Concrete next steps for the support team"),
  suggestedResponse: z
    .string()
    .describe("A professional draft response to the reporting client"),
});

export async function generateIssueSuggestion(
  actor: SessionUser,
  issueId: string,
) {
  if (actor.role !== "MANAGER") throw Errors.forbidden();

  const resolved = resolveAiModel();
  if (!resolved) {
    throw Errors.featureDisabled(
      "AI analysis is not configured. Enter details manually.",
    );
  }

  const issue = await prisma.issue.findFirst({
    where: { id: issueId, deletedAt: null },
    include: { website: { select: { name: true } } },
  });
  if (!issue) throw Errors.notFound("Issue not found");

  const started = Date.now();
  try {
    const { object, usage } = await generateObject({
      model: resolved.model,
      schema: suggestionSchema,
      // Cap output so the call stays cheap and predictable. Without this the
      // provider's default max (up to 64k) is requested, which both inflates
      // cost and can trip credit-limit (402) errors on metered gateways like
      // OpenRouter. The structured suggestion easily fits in 2k tokens.
      maxOutputTokens: 2048,
      system:
        "You are a senior website-support engineer. Analyze the reported issue " +
        "and return concise, actionable suggestions. These are SUGGESTIONS ONLY " +
        "for a human manager to review, edit, and apply.",
      prompt: [
        `Website: ${issue.website.name}`,
        `Reported type: ${issue.type}`,
        `Reported severity: ${issue.severity}`,
        `Title: ${issue.title}`,
        `Description: ${issue.description}`,
      ].join("\n"),
    });
    const latencyMs = Date.now() - started;

    const u = usage as unknown as Record<string, number | undefined>;
    const promptTokens = u?.inputTokens ?? u?.promptTokens ?? null;
    const completionTokens = u?.outputTokens ?? u?.completionTokens ?? null;
    const totalTokens =
      u?.totalTokens ??
      (promptTokens != null && completionTokens != null
        ? promptTokens + completionTokens
        : null);

    const data = {
      status: "SUCCESS" as const,
      provider: resolved.provider,
      model: resolved.modelId,
      suggestedTitle: object.suggestedTitle,
      suggestedCategory: object.suggestedCategory,
      suggestedSeverity: object.suggestedSeverity,
      suggestedStatus: object.suggestedStatus,
      enhancedDescription: object.enhancedDescription,
      summary: object.summary,
      recommendedActions: object.recommendedActions,
      suggestedResponse: object.suggestedResponse,
      latencyMs,
      promptTokens,
      completionTokens,
      totalTokens,
      error: null,
      raw: object as Prisma.InputJsonValue,
    };

    return prisma.$transaction(async (tx) => {
      const suggestion = await tx.aiSuggestion.upsert({
        where: { issueId },
        create: { issueId, ...data },
        update: { ...data, appliedAt: null, appliedById: null },
      });
      await recordIssueEvent(tx, {
        issueId,
        actorId: actor.id,
        type: "AI_SUGGESTION_GENERATED",
        message: `AI suggestions generated via ${resolved.provider} (${resolved.modelId})`,
      });
      return suggestion;
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error("AI suggestion generation failed", { issueId, error: message });
    // Persist the failure so the UI can show it and fall back to manual entry.
    await prisma.aiSuggestion.upsert({
      where: { issueId },
      create: {
        issueId,
        provider: resolved.provider,
        model: resolved.modelId,
        status: "FAILED",
        error: message,
      },
      update: { status: "FAILED", error: message },
    });
    throw Errors.internal("AI analysis failed. Please enter details manually.");
  }
}
