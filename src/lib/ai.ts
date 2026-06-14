import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";
import { env } from "@/lib/env";

/**
 * Resolve a single AI model from whichever provider is configured. Order
 * follows the Master Plan: Gemini → OpenAI → Anthropic, with OpenRouter as the
 * fallback. Returns null when no provider key is present (feature disabled), so
 * the rest of the app degrades gracefully to manual entry.
 * Here also mentioned that if we need to create for the prodcution at time we need to use here vercel sdk for the multimodel LLM Provider
 */
export interface ResolvedModel {
  provider: string;
  modelId: string;
  model: LanguageModel;
}

export function resolveAiModel(): ResolvedModel | null {
  if (env.GEMINI_API_KEY) {
    const modelId = env.GEMINI_MODEL ?? "gemini-2.0-flash";
    const google = createGoogleGenerativeAI({ apiKey: env.GEMINI_API_KEY });
    return { provider: "gemini", modelId, model: google(modelId) };
  }
  if (env.OPENAI_API_KEY) {
    const modelId = env.OPENAI_MODEL ?? "gpt-4o-mini";
    const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
    return { provider: "openai", modelId, model: openai(modelId) };
  }
  if (env.ANTHROPIC_API_KEY) {
    const modelId = env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
    const anthropic = createAnthropic({ apiKey: env.ANTHROPIC_API_KEY });
    return { provider: "anthropic", modelId, model: anthropic(modelId) };
  }
  if (env.OPENROUTER_API_KEY) {
    // OpenRouter is OpenAI-compatible, so we reuse the OpenAI provider.
    const modelId = env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
    const openrouter = createOpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      baseURL: "https://openrouter.ai/api/v1",
    });
    return { provider: "openrouter", modelId, model: openrouter(modelId) };
  }
  return null;
}

export function isAiEnabled(): boolean {
  return resolveAiModel() !== null;
}
