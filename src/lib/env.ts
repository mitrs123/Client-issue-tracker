import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Core variables (DB + JWT) are REQUIRED — the app cannot run without them, so
 * we fail fast with a clear message. Everything else is OPTIONAL and drives a
 * feature flag: a missing key disables the related feature gracefully instead
 * of crashing the server (.clauderules §3 / Master Plan §2.1).
 */
/**
 * An optional string that treats empty/whitespace-only values as absent.
 * Plain `z.string().optional()` keeps `FOO=` (empty) as `""`, which is truthy
 * enough to defeat `??` fallbacks (e.g. a blank OPENROUTER_MODEL would override
 * the default with "") and muddies feature-flag detection. Coercing "" → undefined
 * makes a blank line in .env behave exactly like a missing line.
 */
const optionalString = z.preprocess(
  (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
  z.string().optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // --- Required core ---
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DIRECT_URL: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().url("DIRECT_URL must be a valid connection URL").optional(),
  ),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters for HS256 safety"),
  JWT_EXPIRES_IN: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    z.string().default("7d"),
  ),

  // --- Optional: AI providers (first configured one is used; OpenRouter is the fallback) ---
  GEMINI_API_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  ANTHROPIC_API_KEY: optionalString,
  OPENROUTER_API_KEY: optionalString,
  // Optional per-provider model overrides:
  GEMINI_MODEL: optionalString,
  OPENAI_MODEL: optionalString,
  ANTHROPIC_MODEL: optionalString,
  OPENROUTER_MODEL: optionalString,

  // --- Optional: S3 / storage ---
  S3_ENDPOINT: optionalString,
  S3_REGION: optionalString,
  S3_BUCKET: optionalString,
  S3_ACCESS_KEY_ID: optionalString,
  S3_SECRET_ACCESS_KEY: optionalString,

  // --- Optional: SMTP ---
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalString,
  SMTP_USER: optionalString,
  SMTP_PASSWORD: optionalString,
  SMTP_FROM: optionalString,

  // --- Optional: Web Push (Vapid) ---
  VAPID_PUBLIC_KEY: optionalString,
  VAPID_PRIVATE_KEY: optionalString,
  VAPID_SUBJECT: optionalString,

  // --- Optional: reCAPTCHA ---
  RECAPTCHA_SECRET_KEY: optionalString,

  // --- Optional: secret allowing a cron/scheduler to trigger background dispatch ---
  CRON_SECRET: optionalString,
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
