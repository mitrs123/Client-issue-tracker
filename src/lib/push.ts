import webpush from "web-push";
import { env, features } from "@/lib/env";

/**
 * Web Push (VAPID). Configured lazily; no-ops gracefully when keys are absent.
 */
let configured = false;

export function isPushEnabled(): boolean {
  return features.push;
}

function ensureConfigured(): boolean {
  if (!isPushEnabled()) return false;
  if (!configured) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT ?? "mailto:admin@example.com",
      env.VAPID_PUBLIC_KEY as string,
      env.VAPID_PRIVATE_KEY as string,
    );
    configured = true;
  }
  return true;
}

export interface PushTarget {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function sendPush(
  target: PushTarget,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  if (!ensureConfigured()) throw new Error("Push is not configured");
  await webpush.sendNotification(
    {
      endpoint: target.endpoint,
      keys: { p256dh: target.p256dh, auth: target.auth },
    },
    JSON.stringify(payload),
  );
}
