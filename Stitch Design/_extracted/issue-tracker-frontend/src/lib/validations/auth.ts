import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().min(1, "Username is required").max(64),
  password: z.string().min(1, "Password is required").max(128),
  // Optional: only enforced when reCAPTCHA is configured (graceful degradation).
  recaptchaToken: z.string().optional(),
});
export type LoginInput = z.infer<typeof loginSchema>;
