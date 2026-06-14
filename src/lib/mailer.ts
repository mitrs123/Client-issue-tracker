import nodemailer, { type Transporter } from "nodemailer";
import { env, features } from "@/lib/env";

/**
 * SMTP transport (Nodemailer). Returns null when SMTP isn't configured so email
 * dispatch degrades gracefully instead of crashing.
 */
let transporter: Transporter | null = null;

export function isEmailEnabled(): boolean {
  return features.smtp;
}

export function getTransporter(): Transporter | null {
  if (!isEmailEnabled()) return null;
  if (!transporter) {
    const port = Number(env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD }
        : undefined,
    });
  }
  return transporter;
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<void> {
  const tx = getTransporter();
  if (!tx) throw new Error("Email is not configured");
  await tx.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text,
  });
}
