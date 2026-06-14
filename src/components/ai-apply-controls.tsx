"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { formatEnum } from "@/lib/format";
import { Icon } from "@/components/icon";
import type { IssueSeverity, IssueStatus } from "@/lib/types";

/**
 * Shows the AI-recommended severity and status inside the suggestions panel and
 * lets a manager apply either one with a single click. Applying reuses the
 * existing manager-only PATCH endpoints (/severity, /status), so all the usual
 * validation, audit events and notifications fire exactly as a manual change.
 */
import { useToast } from "@/components/toast";

export function AiApplyControls({
  issueId,
  currentSeverity,
  currentStatus,
  suggestedSeverity,
  suggestedStatus,
}: {
  issueId: string;
  currentSeverity: IssueSeverity;
  currentStatus: IssueStatus;
  suggestedSeverity?: IssueSeverity | null;
  suggestedStatus?: IssueStatus | null;
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [busy, setBusy] = useState<null | "severity" | "status">(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 🎯 APPLY SUGGESTION HANDLER:
   * Submits the recommended status or severity update and reports progress via global toast banners.
   */
  async function apply(kind: "severity" | "status", value: string) {
    setBusy(kind);
    setError(null);
    const valueLabel = formatEnum(value);

    const apiCall = apiFetch(`/api/issues/${issueId}/${kind}`, {
      method: "PATCH",
      json: { [kind]: value },
    });

    try {
      await toastPromise(apiCall, {
        loading: `Applying suggestion: ${kind} to ${valueLabel}...`,
        success: `Applied suggested ${kind} (${valueLabel})!`,
        error: (err) => err instanceof Error ? err.message : `Failed to apply suggestion`,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-[11px] font-bold uppercase text-white/80">
        Recommended classification
      </p>

      {suggestedSeverity && (
        <Row
          label="Severity"
          value={suggestedSeverity}
          already={suggestedSeverity === currentSeverity}
          busy={busy === "severity"}
          onApply={() => apply("severity", suggestedSeverity)}
        />
      )}

      {suggestedStatus && (
        <Row
          label="Status"
          value={suggestedStatus}
          already={suggestedStatus === currentStatus}
          busy={busy === "status"}
          onApply={() => apply("status", suggestedStatus)}
        />
      )}

      {error && <p className="text-xs text-white/80">{error}</p>}
    </div>
  );
}

function Row({
  label,
  value,
  already,
  busy,
  onApply,
}: {
  label: string;
  value: string;
  already: boolean;
  busy: boolean;
  onApply: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/70">
        {label}:{" "}
        <span className="font-bold text-white">{formatEnum(value)}</span>
      </span>
      {already ? (
        <span className="flex items-center gap-1 text-[11px] text-white/50">
          <Icon name="check" className="text-[14px]" /> Applied
        </span>
      ) : (
        <button
          onClick={onApply}
          disabled={busy}
          className="flex items-center gap-1 rounded-md bg-tertiary px-3 py-1 text-[11px] font-bold text-on-tertiary transition-all hover:brightness-110 disabled:opacity-60"
        >
          {busy ? (
            <Icon name="progress_activity" className="animate-spin text-[14px]" />
          ) : (
            <Icon name="check" className="text-[14px]" />
          )}
          Apply
        </button>
      )}
    </div>
  );
}
