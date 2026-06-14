"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTimeAgo, formatEnum } from "@/lib/enum-utils";
import type { Notification, ApiResponse } from "@/lib/types";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const unreadOnly = filter === "unread";
        const response = await fetch(
          `/api/notifications?pageSize=1000&unreadOnly=${unreadOnly}`,
          { credentials: "include" }
        );
        const data: ApiResponse<Notification[]> = await response.json();

        if (data.success && data.data) {
          setNotifications(data.data);
        } else {
          setError("Failed to load notifications");
        }
      } catch (err) {
        console.error("[v0] Failed to fetch notifications:", err);
        setError("Failed to load notifications");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [filter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
        );
      }
    } catch (err) {
      console.error("[v0] Failed to mark notification as read:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/read-all", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
        );
      }
    } catch (err) {
      console.error("[v0] Failed to mark all as read:", err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Tabs/Filter */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            filter === "unread"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread {unreadCount > 0 && `(${unreadCount})`}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-12 text-center">
          <Bell className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-card border border-border rounded-lg p-4 transition-colors ${
                notification.readAt ? "" : "bg-primary/5 border-primary/20"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon/Indicator */}
                <div
                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    notification.readAt
                      ? "bg-muted-foreground"
                      : "bg-primary"
                  }`}
                />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">
                        {notification.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.body}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span>{formatEnum(notification.type)}</span>
                        <span>{getTimeAgo(notification.createdAt)}</span>
                        {notification.issueId && (
                          <Link
                            href={`/issues/${notification.issueId}`}
                            className="text-primary hover:underline"
                          >
                            View Issue
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {!notification.readAt && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
