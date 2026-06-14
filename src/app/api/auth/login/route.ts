import { handle } from "@/lib/route-handler";
import { ok } from "@/lib/api-response";
import { loginSchema } from "@/lib/validations/auth";
import { login } from "@/services/auth.service";
import { setSessionCookie } from "@/lib/cookies";
import { applyRateLimitHeaders, enforceRateLimit } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const POST = handle(async (req) => {
  // Abuse prevention: 5 login attempts per minute per client IP.
  const rl = enforceRateLimit(req, {
    name: "auth:login",
    limit: 5,
    windowMs: 60_000,
  });

  const body = await req.json().catch(() => ({}));
  const input = loginSchema.parse(body);
  // Verify reCAPTCHA when configured (no-op when the secret is absent).
  await verifyRecaptcha(input.recaptchaToken);
  const { user, token } = await login(input);
  await setSessionCookie(token);
  return applyRateLimitHeaders(ok({ user }), rl);
});
