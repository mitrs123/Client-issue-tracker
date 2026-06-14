"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { apiFetch } from "@/lib/api-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

import { useToast } from "@/components/toast";

export function PushToggle() {
  const { promise: toastPromise } = useToast();
  const [status, setStatus] = useState<"idle" | "working" | "enabled">("idle");
  const [error, setError] = useState<string | null>(null);

  // Hidden entirely when push isn't configured (graceful degradation).
  if (!VAPID_PUBLIC_KEY) return null;

  /**
   * 📲 ENABLE PUSH ALERTS:
   * Requests device permission, registers the sw.js service worker, and registers the subscription details.
   * Leverages the global toast.promise to display real-time status.
   */
  async function enable() {
    setStatus("working");
    setError(null);

    const subscribeFlow = (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Push is not supported in this browser");
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Permission denied");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY as string,
        ) as BufferSource,
      });
      const json = sub.toJSON();
      await apiFetch("/api/push/subscribe", {
        method: "POST",
        json: {
          endpoint: json.endpoint,
          keys: json.keys,
          userAgent: navigator.userAgent,
        },
      });
    })();

    try {
      await toastPromise(subscribeFlow, {
        loading: "Enabling push notifications...",
        success: "Push alerts enabled successfully!",
        error: (err) => err instanceof Error ? err.message : "Failed to enable push",
      });
      setStatus("enabled");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enable push");
      setStatus("idle");
    }
  }

  return (
    <div className="mt-md flex justify-end">
      <button
        onClick={enable}
        disabled={status !== "idle"}
        className="flex items-center gap-2 rounded-lg border border-outline-variant/20 bg-surface-container px-4 py-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-60"
      >
      <Icon
        name={status === "enabled" ? "notifications_active" : "notifications"}
        className="text-[18px]"
      />
        {status === "enabled"
          ? "Push enabled"
          : status === "working"
            ? "Enabling…"
            : "Enable push"}
        {error && <span className="text-error">· {error}</span>}
      </button>
    </div>
  );
}
