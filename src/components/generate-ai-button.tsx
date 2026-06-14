"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { apiFetch } from "@/lib/api-client";

import { useToast } from "@/components/toast";

export function GenerateAiButton({
  issueId,
  hasExisting,
}: {
  issueId: string;
  hasExisting: boolean;
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🤖 AI ANALYSIS TRIGGER:
   * Requests LLM analysis (severity recommendation, summarization, action items, and draft response).
   * Displays a global toast loading spinner during the inference call (which can take 1-3 seconds).
   */
  async function generate() {
    setBusy(true);
    setError(null);
    
    const apiCall = apiFetch(`/api/issues/${issueId}/ai-suggestion`, { method: "POST" });

    try {
      await toastPromise(apiCall, {
        loading: "Generating AI suggestions...",
        success: "AI suggestions loaded!",
        error: (err) => err instanceof Error ? err.message : "AI analysis failed",
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={generate}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-tertiary py-2 font-label-md font-bold text-on-tertiary shadow-lg shadow-tertiary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Icon name={busy ? "progress_activity" : "auto_awesome"} className={busy ? "animate-spin text-[18px]" : "text-[18px]"} />
        {busy ? "Analyzing…" : hasExisting ? "Regenerate suggestions" : "Generate suggestions"}
      </button>
      {error && <p className="text-xs text-white/80">{error}</p>}
    </div>
  );
}
