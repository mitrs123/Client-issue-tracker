"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api-client";
import { formatEnum } from "@/lib/format";
import { Icon } from "@/components/icon";
import type { IssueSeverity, IssueStatus } from "@/lib/types";

const STATUSES: IssueStatus[] = [
  "OPEN",
  "IN_REVIEW",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "RESOLVED",
  "CLOSED",
];
const SEVERITIES: IssueSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

import { useToast } from "@/components/toast";

export function IssueAdminControls({
  issueId,
  status,
  severity,
}: {
  issueId: string;
  status: IssueStatus;
  severity: IssueSeverity;
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ⚡ OPTIMISTIC UI STATE:
  // We keep local states for status and severity to allow instant dropdown selection visual changes.
  const [localStatus, setLocalStatus] = useState<IssueStatus>(status);
  const [localSeverity, setLocalSeverity] = useState<IssueSeverity>(severity);

  // Synchronize local state when server props update (e.g. after a router refresh or external update)
  useEffect(() => {
    setLocalStatus(status);
  }, [status]);

  useEffect(() => {
    setLocalSeverity(severity);
  }, [severity]);

  /**
   * 🛠️ MANAGER UPDATE HANDLER:
   * Triggers status or severity updates and tracks their backend state using the global toast notification system.
   * Optimistically updates the visual state and rolls back to the previous value if the API request fails.
   */
  async function update(path: string, body: Record<string, unknown>) {
    const label = path === "status" ? "status" : "severity";
    const value = formatEnum(String(body[label] ?? ""));
    const oldValue = label === "status" ? localStatus : localSeverity;

    // Optimistically update the local state immediately
    if (label === "status") {
      setLocalStatus(body[label] as IssueStatus);
    } else {
      setLocalSeverity(body[label] as IssueSeverity);
    }

    setBusy(true);
    setError(null);

    const apiCall = apiFetch(`/api/issues/${issueId}/${path}`, {
      method: "PATCH",
      json: body,
    });

    try {
      await toastPromise(apiCall, {
        loading: `Updating ${label} to ${value}...`,
        success: `${label.charAt(0).toUpperCase() + label.slice(1)} updated to ${value}!`,
        error: (err) => err instanceof Error ? err.message : `Failed to update ${label}`,
      });
      router.refresh();
    } catch (err) {
      // Rollback to the previous value if the network request fails
      if (label === "status") {
        setLocalStatus(oldValue as IssueStatus);
      } else {
        setLocalSeverity(oldValue as IssueSeverity);
      }
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  const selectCls =
    "cursor-pointer appearance-none rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2 pr-9 font-label-md text-label-md focus:border-tertiary focus:ring-0 disabled:opacity-60";

  return (
    <div className="flex flex-wrap items-center gap-md rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-md">
      <span className="font-label-md text-label-md font-bold text-on-surface-variant">
        Manager actions:
      </span>
      <div className="flex items-center gap-2">
        <label className="font-label-md text-label-md text-on-surface-variant">
          Status
        </label>
        <div className="relative">
          <select
            value={localStatus}
            disabled={busy}
            onChange={(e) => update("status", { status: e.target.value })}
            className={selectCls}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatEnum(s)}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label className="font-label-md text-label-md text-on-surface-variant">
          Severity
        </label>
        <div className="relative">
          <select
            value={localSeverity}
            disabled={busy}
            onChange={(e) => update("severity", { severity: e.target.value })}
            className={selectCls}
          >
            {SEVERITIES.map((s) => (
              <option key={s} value={s}>
                {formatEnum(s)}
              </option>
            ))}
          </select>
          <Icon
            name="expand_more"
            className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant"
          />
        </div>
      </div>
      {error && (
        <span className="font-label-md text-label-md text-error">{error}</span>
      )}
    </div>
  );
}
