"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/icon";
import { apiFetch } from "@/lib/api-client";
import { formatEnum, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/lib/types";

const ICONS: Record<NotificationType, string> = {
  ISSUE_RESOLVED: "task_alt",
  ISSUE_STATUS_CHANGED: "sync",
  ISSUE_SEVERITY_CHANGED: "priority_high",
  ISSUE_RESPONSE: "forum",
  ISSUE_COMMENT: "chat_bubble",
  ISSUE_CREATED: "add_circle",
};

import { useToast } from "@/components/toast";

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const router = useRouter();
  const { promise: toastPromise } = useToast();
  const [items, setItems] = useState(initial);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const unread = items.filter((n) => !n.readAt).length;
  const visible = unreadOnly ? items.filter((n) => !n.readAt) : items;

  /**
   * 📬 MARK SINGLE ALERT READ:
   * Sets the read status locally (optimistic update) and notifies the backend with progress toast.
   */
  async function markRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    const apiCall = apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
    try {
      await toastPromise(apiCall, {
        loading: "Marking alert as read...",
        success: "Alert marked as read",
        error: "Failed to update alert status",
      }, 2000);
    } catch {
      /* ignore */
    }
  }

  /**
   * 📬 MARK ALL ALERTS READ:
   * Performs bulk update on the database to mark all unread notifications for the actor as read.
   */
  async function markAll() {
    setItems((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    const apiCall = apiFetch("/api/notifications/read-all", { method: "POST" });
    try {
      await toastPromise(apiCall, {
        loading: "Marking all alerts as read...",
        success: "All alerts marked as read!",
        error: "Failed to mark alerts as read",
      });
    } catch {
      /* ignore */
    }
    router.refresh();
  }

  function open(n: NotificationItem) {
    if (!n.readAt) void markRead(n.id);
    if (n.issueId) router.push(`/issues/${n.issueId}`);
  }

  return (
    <>
      <div className="mb-lg flex flex-col justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="mb-1 font-headline-md text-headline-md tracking-tight text-primary">
            Notifications
          </h2>
          <p className="text-on-surface-variant opacity-80">
            Manage your alerts and team updates.
          </p>
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-3 rounded-lg border border-outline-variant/10 bg-surface-container px-4 py-2">
            <span className="font-label-md text-label-md text-on-surface-variant">
              Unread only
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={unreadOnly}
              onClick={() => setUnreadOnly((v) => !v)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                unreadOnly ? "bg-tertiary" : "bg-outline-variant",
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  unreadOnly ? "translate-x-6" : "translate-x-1",
                )}
              />
            </button>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-2 rounded-lg border border-tertiary/20 px-4 py-2 font-label-md text-label-md font-bold text-tertiary transition-colors hover:bg-tertiary/5"
            >
              <Icon name="done_all" className="text-[20px]" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-outline-variant/10 bg-white">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <Icon name="notifications_off" className="text-[40px] text-on-surface-variant opacity-40" />
            <p className="font-body-md text-on-surface-variant">
              You&apos;re all caught up.
            </p>
          </div>
        ) : (
          visible.map((n) => {
            const isUnread = !n.readAt;
            return (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={cn(
                  "group relative flex w-full items-start gap-md border-b border-outline-variant/5 p-md text-left transition-colors last:border-0 hover:bg-surface-container-low/40",
                  !isUnread && "opacity-80 hover:opacity-100",
                )}
              >
                {isUnread && (
                  <span className="absolute bottom-0 left-0 top-0 w-1 bg-tertiary" />
                )}
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg",
                    isUnread
                      ? "bg-tertiary/10 text-tertiary"
                      : "bg-on-surface-variant/10 text-on-surface-variant",
                  )}
                >
                  <Icon name={ICONS[n.type]} fill={isUnread} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between">
                    <h3
                      className={cn(
                        "font-bold text-primary",
                        isUnread && "group-hover:text-tertiary",
                      )}
                    >
                      {n.title}
                    </h3>
                    <span className="ml-4 whitespace-nowrap text-xs text-on-surface-variant">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="mb-2 line-clamp-1 text-on-surface-variant">{n.body}</p>
                  <span className="inline-flex items-center gap-1 rounded bg-surface-container-highest px-2 py-0.5 text-xs font-bold text-on-surface-variant">
                    {formatEnum(n.type)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </>
  );
}
