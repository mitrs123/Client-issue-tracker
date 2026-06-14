"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icon } from "@/components/icon";
import { WebsiteStatusPill } from "@/components/badges";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { SafeUser, WebsiteStatus } from "@/lib/types";

interface WebsiteItem {
  id: string;
  name: string;
  url: string;
  status: WebsiteStatus;
  lastCheckedAt: string | null;
  openIssues: number;
}

export function WebsitesList({
  websites,
  clients,
  role,
}: {
  websites: WebsiteItem[];
  clients: SafeUser[];
  role: "CLIENT" | "MANAGER";
}) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [view, setView] = useState<"grid" | "table">("grid");
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isManager = role === "MANAGER";
  const onlineCount = websites.filter((w) => w.status === "ONLINE").length;
  const totalCount = websites.length;
  const openIssuesCount = websites.reduce((sum, w) => sum + w.openIssues, 0);
  const uptime = totalCount ? ((onlineCount / totalCount) * 100).toFixed(2) : "100.00";

  /**
   * 🖥️ WEBSITE REGISTER HANDLER:
   * Submits a new website details to the backend database.
   * Tracks and notifies the manager of the operation progress using the global toast provider.
   */
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const apiCall = apiFetch("/api/websites", {
      method: "POST",
      json: { name, url, clientId },
    });

    try {
      await toastPromise(apiCall, {
        loading: `Registering website ${name}...`,
        success: `Website ${name} registered!`,
        error: (err) => err instanceof Error ? err.message : "Registration failed",
      });
      setName("");
      setUrl("");
      setClientId(clients[0]?.id ?? "");
      setModalOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create website.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Header section with add button */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-5">
        <div>
          <h2 className="text-[28px] md:text-[36px] font-bold leading-tight text-secondary mb-1">Websites</h2>
          <p className="text-body-md text-on-surface-variant max-w-2xl">
            Monitor real-time health and performance across your digital ecosystem.
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-tertiary text-on-tertiary px-5 py-2.5 rounded-lg font-bold hover:opacity-90 transition-all shadow-sm active:scale-95 cursor-pointer font-label-md text-label-md w-full sm:w-auto"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span>Add Website</span>
          </button>
        )}
      </div>


      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-xl">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Active Monitors
          </p>
          <p className="font-headline-md text-[24px] font-bold text-secondary">
            {String(onlineCount).padStart(2, "0")}{" "}
            <span className="text-on-surface-variant/40 text-sm">/ {totalCount}</span>
          </p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-xl">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Overall Uptime
          </p>
          <p className="font-headline-md text-[24px] font-bold text-tertiary">{uptime}%</p>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/20 p-4 rounded-xl">
          <p className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider mb-1">
            Total Issues
          </p>
          <p className="font-headline-md text-[24px] font-bold text-secondary">
            {String(openIssuesCount).padStart(2, "0")}
          </p>
        </div>
      </div>

      {/* Toolbar for view toggling */}
      {websites.length > 0 && (
        <div className="flex justify-end items-center mb-3 gap-2">
          <button
            onClick={() => setView("grid")}
            className={cn(
              "p-2 border rounded-lg transition-all cursor-pointer flex items-center justify-center",
              view === "grid"
                ? "border-tertiary text-tertiary bg-tertiary/5"
                : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"
            )}
            title="Grid View"
          >
            <Icon name="grid_view" />
          </button>
          <button
            onClick={() => setView("table")}
            className={cn(
              "p-2 border rounded-lg transition-all cursor-pointer flex items-center justify-center",
              view === "table"
                ? "border-tertiary text-tertiary bg-tertiary/5"
                : "border-outline-variant/20 text-on-surface-variant hover:bg-surface-container-high"
            )}
            title="Table View"
          >
            <Icon name="view_list" />
          </button>
        </div>
      )}

      {websites.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant/30 py-24 text-center">
          <Icon name="language" className="text-[40px] text-on-surface-variant opacity-40" />
          <p className="font-body-md text-on-surface-variant">No websites are being monitored yet.</p>
          {isManager && (
            <button
              onClick={() => setModalOpen(true)}
              className="mt-4 font-label-md font-bold text-tertiary hover:underline cursor-pointer"
            >
              Add your first website
            </button>
          )}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {websites.map((site) => {

            const border =
              site.status === "DOWN"
                ? "border-2 border-error/20"
                : site.status === "DEGRADED"
                ? "border-2 border-tertiary/20"
                : "border border-outline-variant/20 hover:border-tertiary/40";
            const iconTint =
              site.status === "DOWN"
                ? "bg-error/5 text-error"
                : site.status === "DEGRADED"
                ? "bg-tertiary/5 text-tertiary"
                : "bg-secondary/5 text-secondary";
            const openTint =
              site.openIssues === 0
                ? "text-on-surface"
                : site.status === "DOWN"
                ? "text-error"
                : "text-tertiary";
            return (
              <Link
                key={site.id}
                href={`/issues?websiteId=${site.id}`}
                className={cn(
                  "group relative rounded-xl bg-surface-container-lowest p-4 transition-all hover:-translate-y-1 hover:shadow-lg",
                  border
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg", iconTint)}>
                    <Icon name="language" />
                  </div>
                  <WebsiteStatusPill status={site.status} />
                </div>
                <h3 className="mb-1 font-headline-md text-[20px] font-bold text-secondary">{site.name}</h3>
                <p className="mb-4 truncate font-label-md text-label-md text-on-surface-variant">{site.url}</p>
                <div className="flex items-center gap-4 border-t border-outline-variant/10 pt-4">
                  <div className="flex-1">
                    <p className="text-[11px] uppercase text-on-surface-variant opacity-60">Last Checked</p>
                    <p className="font-label-md text-label-md text-on-surface">
                      {site.lastCheckedAt ? timeAgo(site.lastCheckedAt) : "Never"}
                    </p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[11px] uppercase text-on-surface-variant opacity-60">Open Issues</p>
                    <p className={cn("font-label-md text-label-md font-bold", openTint)}>{site.openIssues}</p>
                  </div>
                </div>
              </Link>
            );
          })}

          {/* Monitor new website card slot */}
          {isManager && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex flex-col items-center justify-center border-2 border-dashed border-outline-variant/30 p-4 rounded-xl hover:border-tertiary/40 transition-colors group cursor-pointer h-full min-h-[180px]"
            >
              <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center mb-3 group-hover:bg-tertiary/10 transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-tertiary">
                  add_circle
                </span>
              </div>
              <span className="font-label-md text-label-md font-bold text-on-surface-variant">
                Monitor New Website
              </span>
            </button>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant/10">
                  <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                    Website Name
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                    URL
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-md py-4 font-label-md text-label-md text-on-surface-variant font-bold uppercase tracking-wider text-right">
                    Open Issues
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {websites.map((site) => (
                  <tr
                    key={site.id}
                    className="hover:bg-surface-container-low/50 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/issues?websiteId=${site.id}`)}
                  >
                    <td className="px-md py-4 font-label-md text-label-md text-secondary font-semibold group-hover:text-tertiary transition-colors">
                      {site.name}
                    </td>
                    <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                      {site.url}
                    </td>
                    <td className="px-md py-4">
                      <WebsiteStatusPill status={site.status} />
                    </td>
                    <td className="px-md py-4 font-label-md text-label-md text-on-surface-variant">
                      {site.lastCheckedAt ? timeAgo(site.lastCheckedAt) : "Never"}
                    </td>
                    <td className="px-md py-4 font-label-md text-label-md text-right font-bold text-on-surface">
                      {site.openIssues}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Website Modal Dialog */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-secondary/30 backdrop-blur-sm">
          <div
            className="fixed inset-0"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-md lg:p-lg shadow-2xl z-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full pointer-events-none" />
            <h3 className="font-headline-md text-headline-md text-secondary font-bold mb-2">
              Monitor New Website
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Enter target details and assign a client to register a new website for automated status checks.
            </p>

            <form onSubmit={onSubmit} className="space-y-md">
              <div className="space-y-2">
                <label className="block font-label-md text-label-md font-bold text-primary">
                  Website Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Billing Dashboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-body-md text-body-md outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label-md text-label-md font-bold text-primary">
                  Website URL
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://billing.acme.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest font-body-md text-body-md outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-label-md text-label-md font-bold text-primary">
                  Client Owner
                </label>
                <div className="relative">
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    required
                    className="w-full h-12 px-4 bg-surface-container-lowest border border-outline-variant/30 rounded-lg font-body-md appearance-none focus:border-tertiary focus:ring-1 focus:ring-tertiary outline-none pr-10"
                  >
                    {clients.length === 0 && (
                      <option value="">No clients available</option>
                    )}
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.username})
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-error-container px-4 py-3 font-label-md text-label-md text-error">
                  <Icon name="error" className="text-[18px]" />
                  {error}
                </div>
              )}

              <div className="pt-6 border-t border-outline-variant/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-2.5 rounded-lg border border-primary/20 font-label-md text-label-md font-bold text-primary hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busy || clients.length === 0}
                  className="px-6 py-2.5 rounded-lg font-bold text-white bg-tertiary shadow-xl shadow-tertiary/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-label-md text-label-md"
                >
                  {busy ? "Adding..." : "Add Website"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
