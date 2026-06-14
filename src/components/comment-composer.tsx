"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { apiFetch } from "@/lib/api-client";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

export function CommentComposer({
  issueId,
  canPostInternal,
}: {
  issueId: string;
  canPostInternal: boolean;
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 📬 COMMENT SUBMISSION HANDLER:
   * Wraps the API fetch inside a global toast.promise context.
   * This provides the user with visual indicators (Spinner -> Success checkmark or Error badge)
   * while the background database write and notification emails are dispatched.
   */
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);

    const apiCall = apiFetch(`/api/issues/${issueId}/comments`, {
      method: "POST",
      json: { body, isInternal: canPostInternal ? isInternal : false },
    });

    try {
      await toastPromise(apiCall, {
        loading: isInternal ? "Posting internal note..." : "Posting message...",
        success: isInternal ? "Internal note posted!" : "Message posted!",
        error: (err) => err instanceof Error ? err.message : "Failed to post message",
      });
      setBody("");
      setIsInternal(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="pt-2">
      {canPostInternal && (
        <div className="mb-sm flex justify-end">
          <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg border border-outline-variant/10">
            <button
              type="button"
              onClick={() => setIsInternal(false)}
              className={cn(
                "px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer",
                !isInternal
                  ? "bg-white shadow-sm text-on-surface font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Public
            </button>
            <button
              type="button"
              onClick={() => setIsInternal(true)}
              className={cn(
                "px-3 py-1.5 rounded-md font-label-md text-label-md transition-all cursor-pointer",
                isInternal
                  ? "bg-white shadow-sm text-on-surface font-bold"
                  : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Internal Note
            </button>
          </div>
        </div>
      )}

      <div className={cn(
        "overflow-hidden rounded-xl border transition-all focus-within:border-tertiary",
        isInternal
          ? "border-amber-200 bg-amber-50/20"
          : "border-outline-variant/30 bg-surface-container-lowest"
      )}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder={isInternal ? "Write an internal-only note for the team..." : "Type your response…"}
          className="min-h-[96px] w-full resize-none border-none bg-transparent p-md font-body-md text-body-md outline-none placeholder:text-on-surface-variant/40 focus:ring-0"
        />
        <div className="flex items-center justify-between border-t border-outline-variant/10 p-3">
          <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
            {isInternal ? (
              <>
                <Icon name="lock" className="text-amber-700 text-[14px]" />
                <span className="text-amber-800 font-medium">Internal Note (managers only)</span>
              </>
            ) : (
              <>
                <Icon name="public" className="text-[14px]" />
                <span>Visible to everyone on this issue</span>
              </>
            )}
          </div>
          <button
            type="submit"
            disabled={busy || !body.trim()}
            className="flex items-center gap-2 rounded-lg bg-tertiary px-6 py-2 font-label-md font-bold text-on-tertiary transition-all hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {busy ? "Posting…" : "Post Message"}
          </button>
        </div>
      </div>
      {error && (
        <p className="mt-2 font-label-md text-label-md text-error">{error}</p>
      )}
    </form>
  );
}

