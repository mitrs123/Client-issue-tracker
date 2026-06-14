import { Errors } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Server-side Google reCAPTCHA verification.
 *
 * Graceful degradation (.clauderules §3): if no secret is configured the check
 * is skipped (feature disabled). When enabled, a missing or invalid token is
 * rejected. Supports both reCAPTCHA v2 (success boolean) and v3 (score). The
 * secret is read at call time so the feature can be toggled per environment
 * without a rebuild.
 */

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const MIN_SCORE = 0.5; // reCAPTCHA v3 threshold

interface SiteVerifyResponse {
  success: boolean;
  score?: number;
  action?: string;
  "error-codes"?: string[];
}

export function isRecaptchaEnabled(): boolean {
  return Boolean(process.env.RECAPTCHA_SECRET_KEY);
}

export async function verifyRecaptcha(token: string | undefined): Promise<void> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return; // feature disabled → skip verification

  if (!token) throw Errors.badRequest("reCAPTCHA token is required");

  let data: SiteVerifyResponse;
  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    data = (await res.json()) as SiteVerifyResponse;
  } catch (err) {
    logger.warn("reCAPTCHA verification request failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    // Fail closed: never allow a bypass when verification cannot complete.
    throw Errors.badRequest("Could not verify reCAPTCHA, please try again");
  }

  if (!data.success) {
    throw Errors.badRequest("reCAPTCHA verification failed", {
      errors: data["error-codes"] ?? [],
    });
  }
  if (typeof data.score === "number" && data.score < MIN_SCORE) {
    throw Errors.forbidden("reCAPTCHA score too low; please try again");
  }
}
