"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { apiFetch } from "@/lib/api-client";
import { formatEnum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IssueSeverity, IssueType } from "@/lib/types";

const TYPES: IssueType[] = ["BUG", "FEEDBACK", "SUGGESTION", "IMPROVEMENT"];
const SEVERITIES: IssueSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const labelCls = "block font-label-md text-label-md font-bold text-primary";
const fieldCls =
  "w-full h-12 px-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-body-md text-body-md outline-none transition-all focus:border-tertiary focus:ring-1 focus:ring-tertiary";

import { useToast } from "@/components/toast";

export function ReportIssueForm({
  websites,
}: {
  websites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [websiteId, setWebsiteId] = useState(websites[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<IssueType>("BUG");
  const [severity, setSeverity] = useState<IssueSeverity>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 📤 ISSUE CREATION SUBMITTER:
   * Triggers the post request to create a new issue entry in the database.
   * Tracks progression from pending to success/error states via global toast notification.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const apiCall = apiFetch<{ id: string }>("/api/issues", {
        method: "POST",
        json: { websiteId, title, description, type, severity },
      });

      const issue = await toastPromise(apiCall, {
        loading: "Submitting issue report...",
        success: "Issue reported successfully!",
        error: (err) => err instanceof Error ? err.message : "Failed to report issue.",
      });

      router.push(`/issues/${issue.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create issue.");
      setSubmitting(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-white p-md lg:p-lg">
      <div className="absolute -mr-16 -mt-16 right-0 top-0 h-32 w-32 rounded-bl-full bg-tertiary/5" />
      <form onSubmit={onSubmit} className="relative space-y-md">
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls} htmlFor="website">
              Target Website
            </label>
            <div className="relative">
              <select
                id="website"
                value={websiteId}
                onChange={(e) => setWebsiteId(e.target.value)}
                required
                className={cn(fieldCls, "appearance-none pr-10")}
              >
                {websites.length === 0 && <option value="">No websites available</option>}
                {websites.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls} htmlFor="type">
              Issue Type
            </label>
            <div className="relative">
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
                className={cn(fieldCls, "appearance-none pr-10")}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatEnum(t)}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className={labelCls} htmlFor="title">
              Issue Title
            </label>
            <span
              className={cn(
                "text-[12px] font-medium text-on-surface-variant",
                title.length >= 150 && "text-tertiary",
              )}
            >
              {title.length} / 160
            </span>
          </div>
          <input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
            required
            placeholder="e.g. Navigation menu overlaps on mobile viewport"
            className={cn(fieldCls, "placeholder:opacity-50")}
          />
        </div>

        <div className="space-y-2">
          <label className={labelCls} htmlFor="description">
            Detailed Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10000}
            rows={5}
            required
            placeholder="Steps to reproduce, expected behavior, and actual behavior…"
            className="w-full resize-none rounded-lg border border-outline-variant/30 bg-surface-container-lowest p-4 font-body-md text-body-md outline-none transition-all placeholder:opacity-50 focus:border-tertiary focus:ring-1 focus:ring-tertiary"
          />
        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div className="space-y-2">
            <label className={labelCls}>Severity Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SEVERITIES.map((s) => (

                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "rounded-lg px-2 py-3 font-label-md text-label-md transition-colors",
                    severity === s
                      ? "border-2 border-tertiary bg-tertiary/5 font-bold text-tertiary"
                      : "border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container",
                  )}
                >
                  {formatEnum(s)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelCls}>Attachments</label>
            <div className="border-2 border-dashed border-outline-variant/30 rounded-lg p-4 flex flex-col items-center justify-center bg-surface-container-low/30 hover:bg-surface-container-low transition-all cursor-pointer group">
              <Icon
                name="cloud_upload"
                className="text-on-surface-variant group-hover:text-tertiary transition-colors"
              />
              <p className="mt-2 text-[12px] text-on-surface-variant">
                Drop files or <span className="text-tertiary font-bold">browse</span>
              </p>
              <p className="mt-1 text-[10px] uppercase text-on-surface-variant/60">
                Image, PDF, log (max 10MB)
              </p>
            </div>
          </div>

        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[18px]" />
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse justify-end gap-3 border-t border-outline-variant/10 pt-md sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-primary/20 px-8 py-3 font-label-md font-bold text-primary transition-colors hover:bg-surface-container"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || websites.length === 0}
            className="flex items-center justify-center gap-2 rounded-lg bg-tertiary px-10 py-3 font-bold text-on-tertiary shadow-lg shadow-tertiary/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting && <Icon name="progress_activity" className="animate-spin text-[18px]" />}
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </div>
      </form>
    </div>
  );
}
