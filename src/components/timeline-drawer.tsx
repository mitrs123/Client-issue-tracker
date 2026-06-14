"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icon";
import { formatDate, formatEnum } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IssueEventType } from "@/lib/types";

// Map issue events to respective Material Symbols icons
const EVENT_ICON: Record<string, string> = {
  CREATED: "flag",
  STATUS_CHANGED: "sync",
  SEVERITY_CHANGED: "priority_high",
  ASSIGNED: "person_add",
  UNASSIGNED: "person_remove",
  COMMENT_ADDED: "chat_bubble",
  RESPONSE_ADDED: "forum",
  ATTACHMENT_ADDED: "attach_file",
  RESOLVED: "task_alt",
  REOPENED: "restart_alt",
  CLOSED: "check_circle",
  AI_SUGGESTION_GENERATED: "auto_awesome",
  AI_SUGGESTION_APPLIED: "auto_awesome",
};

interface TimelineEvent {
  id: string;
  type: IssueEventType;
  fromValue: string | null;
  toValue: string | null;
  message: string | null;
  createdAt: Date;
  actor: { name: string } | null;
}

function describeEvent(e: TimelineEvent): string {
  const who = e.actor?.name ?? "System";
  switch (e.type) {
    case "CREATED":
      return `${who} reported this issue`;
    case "STATUS_CHANGED":
      return `${who} changed status to ${formatEnum(e.toValue ?? "")}`;
    case "SEVERITY_CHANGED":
      return `${who} changed severity to ${formatEnum(e.toValue ?? "")}`;
    case "RESOLVED":
      return `${who} resolved this issue`;
    case "REOPENED":
      return `${who} reopened this issue`;
    case "CLOSED":
      return `${who} closed this issue`;
    case "COMMENT_ADDED":
      return `${who} commented`;
    case "RESPONSE_ADDED":
      return `${who} responded`;
    case "ASSIGNED":
      return `${who} assigned the issue`;
    default:
      return e.message ?? `${who} · ${formatEnum(e.type)}`;
  }
}

export function TimelineDrawer({ timeline }: { timeline: TimelineEvent[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Triggers the opening transition sequence
  const openDrawer = () => {
    setShouldRender(true);
    // Allow React to mount the component first, then trigger CSS slide-in transition on next tick
    setTimeout(() => setIsOpen(true), 20);
  };

  // Triggers the closing transition sequence
  const closeDrawer = () => {
    setIsOpen(false);
    // Unmount from DOM only after the CSS transition (300ms) completes
    setTimeout(() => setShouldRender(false), 300);
  };

  // Keyboard accessibility: Dismiss the drawer when pressing the Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* ─── TRIGGER BUTTON ───
         Positioned in the header next to metadata for quick accessibility */}
      <button
        onClick={openDrawer}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-tertiary hover:bg-tertiary/5 transition-colors cursor-pointer"
        aria-label="View history timeline"
      >
        <span className="material-symbols-outlined text-[16px]">history</span>
        <span>History</span>
      </button>

      {/* ─── SLIDE-OVER DRAWER PORTAL ─── */}
      {shouldRender && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop overlay: fades in */}
          <div
            onClick={closeDrawer}
            className={cn(
              "fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 ease-out",
              isOpen ? "opacity-100" : "opacity-0"
            )}
          />

          {/* Drawer side panel: slides in from right */}
          <div
            className={cn(
              "fixed right-0 top-0 bottom-0 flex w-full max-w-md flex-col bg-surface-container-lowest border-l border-outline-variant/10 shadow-2xl transition-transform duration-300 ease-out",
              isOpen ? "translate-x-0" : "translate-x-full"
            )}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-outline-variant/10 px-6 py-5 bg-surface-container-low/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">history</span>
                <h3 className="font-headline-md text-[18px] font-bold text-secondary">
                  Issue Timeline
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer flex items-center justify-center"
                aria-label="Close drawer"
              >
                <Icon name="close" className="text-[20px]" />
              </button>
            </div>

            {/* Scrollable Events Trail */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {timeline.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center text-on-surface-variant opacity-60 gap-2">
                  <span className="material-symbols-outlined text-[48px]">history_toggle_off</span>
                  <p className="font-body-md">No timeline events recorded.</p>
                </div>
              ) : (
                <div className="relative space-y-6 pl-4 before:absolute before:bottom-2 before:left-[19px] before:top-2 before:w-[2px] before:bg-outline-variant/30">
                  {timeline.map((e) => (
                    <div key={e.id} className="relative flex gap-4">
                      {/* Event node badge */}
                      <div className="z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tertiary/10">
                        <span className="material-symbols-outlined text-[12px] text-tertiary font-bold">
                          {EVENT_ICON[e.type] ?? "history"}
                        </span>
                      </div>
                      
                      {/* Event description & date */}
                      <div className="min-w-0 flex-1">
                        <p className="font-label-md text-label-md text-on-surface leading-snug">
                          {describeEvent(e)}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1 opacity-70">
                          {formatDate(e.createdAt.toISOString())}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
