"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

import { Icon } from "@/components/icon";
import { useAuth } from "@/lib/auth-context";
import { formatEnum, initials, timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationType } from "@/lib/types";
import { useToast } from "@/components/toast";
import { apiFetch } from "@/lib/api-client";

const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  ISSUE_RESOLVED: "task_alt",
  ISSUE_STATUS_CHANGED: "sync",
  ISSUE_SEVERITY_CHANGED: "priority_high",
  ISSUE_RESPONSE: "forum",
  ISSUE_COMMENT: "chat_bubble",
  ISSUE_CREATED: "add_circle",
};

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  // ⏳ DEBOUNCING MECHANISM:
  // We use a React ref (`debounce`) to hold the active timeout identifier.
  // When the user is typing, we cancel the previously scheduled timeout and set a new one.
  // This prevents triggering page navigations / DB queries on every single keystroke.
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the input in sync when the URL changes externally
  // (e.g. "Clear Filters" button, back/forward navigation).
  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  /**
   * 🔎 DEBOUNCED SEARCH HANDLER:
   * - Triggers 350ms after the user stops typing.
   * - Keeps URL filters intact (status, type, etc.) if they are already on the issues page.
   * - Redirects to /issues?search=... if searched from another page (like the Dashboard).
   */
  function onSearchChange(value: string) {
    setSearch(value);
    
    // Cancel the pending timeout since the user is still typing
    if (debounce.current) clearTimeout(debounce.current);
    
    // Set a new timeout that runs after 350ms of inactivity
    debounce.current = setTimeout(() => {
      const q = value.trim();
      // Preserve other existing query params (status, severity, type etc.)
      // only when already on the /issues page.
      if (pathname === "/issues") {
        const next = new URLSearchParams(searchParams.toString());
        if (q) next.set("search", q);
        else next.delete("search");
        next.delete("page");
        router.push(`/issues?${next.toString()}`);
      } else {
        router.push(q ? `/issues?search=${encodeURIComponent(q)}` : "/issues");
      }
    }, 350);
  }

  // Poll unread notification count (30s) only while the tab is visible.
  // The count lives in the envelope `meta.unread`, so we read the raw response.
  useEffect(() => {
    let stopped = false;
    async function loadUnread() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch(
          "/api/notifications?unreadOnly=true&pageSize=1",
          { credentials: "include" },
        );
        const json = await res.json();
        if (json?.success) setUnread(json.meta?.unread ?? 0);
      } catch {
        /* ignore transient errors */
      }
    }
    loadUnread();
    const id = setInterval(loadUnread, 30_000);
    document.addEventListener("visibilitychange", loadUnread);
    return () => {
      stopped = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", loadUnread);
    };
  }, []);

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  // 🔔 WEB PUSH PERMISSION STATES & HANDLERS:
  const { promise: toastPromise } = useToast();
  const [showSettings, setShowSettings] = useState(false);
  const [pushStatus, setPushStatus] = useState<"default" | "granted" | "denied" | "unsupported">("default");
  const [subscribing, setSubscribing] = useState(false);

  // Check browser Notification API support and current permission on component mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPushStatus("unsupported");
    } else {
      setPushStatus(Notification.permission);
    }
  }, []);

  /**
   * 📲 WEB PUSH REGISTRATION SEQUENCE:
   * Requests device notification permission and subscribes the user agent to VAPID push service.
   * This is wrapped inside the global toast tracker to display feedback to the user.
   */
  async function enablePush() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    
    setSubscribing(true);
    const subscribeFlow = (async () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        throw new Error("Web push notifications are not supported in this browser.");
      }
      
      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      setPushStatus(permission);
      
      if (permission !== "granted") {
        throw new Error("Notification permission request denied.");
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
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
        loading: "Requesting browser permission...",
        success: "Push notifications enabled successfully!",
        error: (err) => err instanceof Error ? err.message : "Failed to register push",
      });
    } catch {
      /* handled inside toast */
    } finally {
      setSubscribing(false);
    }
  }

  /**
   * ⚡ LAZY DATA LOADING OPTIMIZATION:
   * Instead of loading all notifications during the initial page render, 
   * we fetch the user's notifications list only on-demand when the popover dropdown is opened.
   */
  async function loadNotificationsList() {
    setNotificationsLoading(true);
    try {
      const res = await fetch(
        `/api/notifications?unreadOnly=${unreadOnly}&pageSize=20`,
        { credentials: "include" },
      );
      const json = await res.json();
      if (json?.success) {
        setNotifications(json.data ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setNotificationsLoading(false);
    }
  }

  // Fetch notifications list when the popup opens, or when the "Unread Only" toggle is switched
  useEffect(() => {
    if (notificationsOpen) {
      loadNotificationsList();
    }
  }, [notificationsOpen, unreadOnly]);

  /**
   * 🚀 OPTIMISTIC UPDATE:
   * Instantly mark the notification as read in the local component state so the UI reflects 
   * the change without waiting for the network roundtrip.
   */
  async function markNotificationRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnread((prev) => Math.max(0, prev - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * 🚀 OPTIMISTIC UPDATE:
   * Instantly clear all unread notification badges locally, then sync the change with the backend API.
   */
  async function markAllNotificationsRead() {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
    );
    setUnread(0);
    try {
      await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      /* ignore */
    }
  }

  /**
   * 🖱️ NOTIFICATION CLICK HANDLER:
   * Marks the item as read, closes the popover dropdown, and routes the user directly 
   * to the corresponding issue detail page.
   */
  function handleNotificationClick(n: NotificationItem) {
    if (!n.readAt) {
      markNotificationRead(n.id);
    }
    setNotificationsOpen(false);
    if (n.issueId) {
      router.push(`/issues/${n.issueId}`);
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-outline-variant/10 bg-surface-container-lowest px-4 sm:px-6">
      <div className="flex flex-1 items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-1 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high md:hidden flex items-center justify-center cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Icon name="menu" className="text-[24px]" />
          </button>
        )}
        <div className="relative w-full max-w-md">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant opacity-60"
          />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title, issue #, site or client..."
            className="w-full rounded-lg border border-outline-variant/20 bg-surface-container py-2 pl-10 pr-4 font-body-md text-body-md outline-none transition-all focus:border-tertiary focus:ring-2 focus:ring-tertiary"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen((v) => !v)}
            aria-label="Notifications"
            className="relative rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-tertiary cursor-pointer flex items-center justify-center"
          >
            <Icon name="notifications" />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-tertiary px-1 text-[10px] font-bold text-on-tertiary">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <>
              {/* Dropdown Backdrop to close on click outside */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setNotificationsOpen(false)}
              />
              
              {/* Dropdown Popup Card */}
              <div className="absolute right-0 z-40 mt-2 w-80 sm:w-[380px] overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl flex flex-col max-h-[440px]">
                {/* Popover Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/10 px-4 py-3 bg-surface-container-low/50">
                  <div className="flex items-center gap-2">
                    {showSettings && (
                      <button
                        onClick={() => setShowSettings(false)}
                        className="rounded hover:bg-surface-container-high p-0.5 text-on-surface-variant transition-colors cursor-pointer"
                        aria-label="Back to notifications"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      </button>
                    )}
                    <h4 className="font-label-md text-label-md font-bold text-on-surface">
                      {showSettings ? "Notification Settings" : "Notifications"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    {!showSettings && (
                      <>
                        <button
                          onClick={() => setUnreadOnly((v) => !v)}
                          className="font-label-md text-[11px] font-bold text-tertiary hover:underline cursor-pointer"
                        >
                          {unreadOnly ? "Show All" : "Unread Only"}
                        </button>
                        {unread > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="font-label-md text-[11px] font-bold text-on-surface-variant hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </>
                    )}
                    {/* OPTIMIZATION: Settings gear icon to access push notification toggle */}
                    <button
                      onClick={() => setShowSettings((v) => !v)}
                      className={cn(
                        "rounded p-1 transition-colors cursor-pointer flex items-center justify-center hover:bg-surface-container-high",
                        showSettings ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary"
                      )}
                      aria-label="Notification settings"
                    >
                      <span className="material-symbols-outlined text-[16px]">settings</span>
                    </button>
                  </div>
                </div>

                {/* Popover Body Content */}
                {showSettings ? (
                  /* ─── WEB PUSH SETTINGS CARD PANEL ─── */
                  <div className="p-4 flex flex-col gap-3">
                    <div>
                      <h5 className="font-label-md text-label-md font-bold text-on-surface mb-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-tertiary">notifications_active</span>
                        Web Push Alerts
                      </h5>
                      <p className="text-xs text-on-surface-variant leading-relaxed opacity-80">
                        Stay informed on issue updates, assignments, and client feedback with desktop alert notifications even when browser tabs are closed.
                      </p>
                    </div>

                    <div className="border-t border-outline-variant/10 pt-3 mt-1 flex flex-col gap-2">
                      {pushStatus === "unsupported" && (
                        <div className="rounded-lg bg-surface-container p-3 flex gap-2 items-start text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined text-error text-[16px] shrink-0">info</span>
                          <p>Push alerts are not supported by your current browser environment.</p>
                        </div>
                      )}

                      {pushStatus === "denied" && (
                        <div className="rounded-lg bg-error-container/20 border border-error/20 p-3 flex gap-2 items-start text-xs text-error">
                          <span className="material-symbols-outlined text-[16px] shrink-0">warning</span>
                          <p>Browser notification access has been blocked. Please enable notifications in your browser security settings to activate push alerts.</p>
                        </div>
                      )}

                      {pushStatus === "granted" && (
                        <div className="rounded-lg bg-tertiary/5 border border-tertiary/20 p-3 flex gap-2 items-start text-xs text-tertiary">
                          <span className="material-symbols-outlined text-[16px] shrink-0 font-bold">check_circle</span>
                          <div>
                            <p className="font-bold">Notifications Enabled</p>
                            <p className="text-on-surface-variant opacity-80 mt-0.5">Real-time web push updates are active on this device.</p>
                          </div>
                        </div>
                      )}

                      {pushStatus === "default" && (
                        <button
                          onClick={enablePush}
                          disabled={subscribing}
                          className="w-full flex items-center justify-center gap-2 rounded-lg bg-tertiary py-2.5 font-label-md font-bold text-on-tertiary shadow-lg shadow-tertiary/10 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {subscribing ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-on-tertiary/30 border-t-on-tertiary" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                              Enable Push Alerts
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* ─── STANDARD NOTIFICATIONS LIST VIEW ─── */
                  <div className="overflow-y-auto divide-y divide-outline-variant/5">
                    {notificationsLoading ? (
                      <div className="py-12 text-center font-label-md text-label-md text-on-surface-variant opacity-60">
                        Loading notifications...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="py-16 text-center text-on-surface-variant flex flex-col items-center justify-center gap-2">
                        <Icon name="notifications_off" className="text-[32px] opacity-30" />
                        <p className="font-body-md text-on-surface-variant">All caught up!</p>
                      </div>
                    ) : (
                      notifications.map((n) => {
                        const isUnread = !n.readAt;
                        return (
                          <button
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={cn(
                              "group relative flex w-full items-start gap-3 border-b border-outline-variant/5 p-3 text-left transition-colors last:border-0 hover:bg-surface-container-low/40 cursor-pointer",
                              !isUnread && "opacity-75 hover:opacity-100",
                            )}
                          >
                            {isUnread && (
                              <span className="absolute bottom-0 left-0 top-0 w-1 bg-tertiary" />
                            )}
                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm",
                                isUnread
                                  ? "bg-tertiary/10 text-tertiary"
                                  : "bg-on-surface-variant/10 text-on-surface-variant",
                              )}
                            >
                              <Icon name={NOTIFICATION_ICONS[n.type as NotificationType] ?? "notifications"} fill={isUnread} className="text-[16px]" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-0.5 flex items-start justify-between">
                                <h5
                                  className={cn(
                                    "font-label-md text-label-md font-bold text-primary truncate pr-2",
                                    isUnread && "group-hover:text-tertiary",
                                  )}
                                >
                                  {n.title}
                                </h5>
                                <span className="shrink-0 text-[10px] text-on-surface-variant opacity-70">
                                  {timeAgo(n.createdAt)}
                                </span>
                              </div>
                              <p className="line-clamp-2 text-xs text-on-surface-variant leading-normal">{n.body}</p>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-outline-variant/20" />

        {/* Profile menu container - relative positioning context for the absolute dropdown card */}
        <div className="relative">
          {/* OPTIMIZATION: Interactive trigger for user profile dropdown menu */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <div className="text-right">
              <p className="font-label-md text-label-md font-bold text-on-surface">
                {user.name}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-on-surface-variant opacity-70">
                {formatEnum(user.role)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-label-md font-bold text-on-secondary">
              {initials(user.name)}
            </div>
          </button>

          {/* Conditional rendering of the profile dropdown menu */}
          {menuOpen && (
            <>
              {/* Back-drop overlay: closes the dropdown menu when clicking anywhere else on the screen */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown Card: aligned absolutely below the trigger, positioned with z-20 so it stacks above the backdrop */}
              <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-lowest shadow-lg">
                <div className="border-b border-outline-variant/10 px-4 py-3">
                  <p className="font-label-md text-label-md font-bold text-on-surface">
                    {user.name}
                  </p>
                  <p className="text-[12px] text-on-surface-variant">
                    {user.email}
                  </p>
                </div>
                {/* Logout Action: Triggers auth-context API post call and redirects client window back to /login */}
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left font-label-md text-label-md text-error transition-colors hover:bg-surface-container-high"
                >
                  <Icon name="logout" className="text-[18px]" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── HELPER FOR WEB PUSH VAPID KEY CONVERSION ───
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}
