import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Core variables (DB + JWT) are REQUIRED — the app cannot run without them, so
 * we fail fast with a clear message. Everything else is OPTIONAL and drives a
 * feature flag: a missing key disables the related feature gracefully instead
 * of crashing the server (.clauderules §3 / Master Plan §2.1).
 */
const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Required core ---
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid connection URL").optional(),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for HS256 safety"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // --- Optional: AI providers ---
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),

  // --- Optional: S3 / storage ---
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),

  // --- Optional: SMTP ---
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // --- Optional: Web Push (Vapid) ---
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),

  // --- Optional: reCAPTCHA ---
  RECAPTCHA_SECRET_KEY: z.string().optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function loadEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(
      `Invalid or missing environment variables:\n${issues}\n` +
        "See .env.example for the full contract.",
    );
  }
  return parsed.data;
}

export const env = loadEnv();

/**
 * Feature flags derived from which optional secrets are present. Services and
 * UI read these to enable/disable features without ever crashing.
 */
export const features = {
  ai:
    Boolean(env.GEMINI_API_KEY) ||
    Boolean(env.OPENAI_API_KEY) ||
    Boolean(env.ANTHROPIC_API_KEY) ||
    Boolean(env.OPENROUTER_API_KEY),
  s3:
    Boolean(env.S3_BUCKET) &&
    Boolean(env.S3_ACCESS_KEY_ID) &&
    Boolean(env.S3_SECRET_ACCESS_KEY),
  smtp: Boolean(env.SMTP_HOST) && Boolean(env.SMTP_FROM),
  push: Boolean(env.VAPID_PUBLIC_KEY) && Boolean(env.VAPID_PRIVATE_KEY),
  // Rate limiting is always-on (in-memory, no external dependency).
  recaptcha: Boolean(env.RECAPTCHA_SECRET_KEY),
} as const;

export type FeatureFlags = typeof features;
