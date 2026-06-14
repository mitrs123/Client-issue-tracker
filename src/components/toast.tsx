"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";

// ─── TYPES & STATES ───
export type ToastType = "pending" | "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // Time in ms before auto-dismiss
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (message: string, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<ToastItem, "id">>) => void;
  // Standard helper to track asynchronous operations (pending -> success / error)
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
    duration?: number
  ) => Promise<T>;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// ─── TOAST PROVIDER ───
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  
  // Track active timeouts to prevent memory leaks on fast transitions / unmounts
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Clean up a specific timeout when a toast is dismissed
  const clearToastTimeout = useCallback((id: string) => {
    if (timeouts.current[id]) {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    }
  }, []);

  // Dismisses a toast by filtering it out from active list and clearing its timeout
  const dismissToast = useCallback((id: string) => {
    clearToastTimeout(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, [clearToastTimeout]);

  // Adds a new toast to the stack. Generates a unique ID and registers an auto-dismiss timer.
  const addToast = useCallback((
    message: string,
    type: ToastType = "info",
    duration = 4000
  ): string => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    // Only auto-dismiss if it's not a pending operation toast
    if (type !== "pending") {
      timeouts.current[id] = setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  // Updates a toast (e.g. changing its message or transitioning status from pending to success/error)
  const updateToast = useCallback((
    id: string,
    updates: Partial<Omit<ToastItem, "id">>
  ) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };

        // Handle auto-dismiss timer on state change:
        // If transitioning away from "pending", schedule the auto-dismiss timer.
        if (t.type === "pending" && updated.type !== "pending") {
          clearToastTimeout(id);
          const duration = updated.duration ?? 4000;
          timeouts.current[id] = setTimeout(() => {
            dismissToast(id);
          }, duration);
        }

        return updated;
      })
    );
  }, [dismissToast, clearToastTimeout]);

  /**
   * 🔄 PROMISE LIFECYCLE TRACKER:
   * Automates the process of notifying the user during asynchronous requests:
   * 1. Creates a "pending" toast indicating the request is in flight.
   * 2. Resolves or rejects the promise.
   * 3. Transitions the toast to "success" or "error" with the respective message,
   *    and starts the auto-dismiss countdown.
   */
  const promise = useCallback(async <T,>(
    promiseFn: Promise<T> | (() => Promise<T>),
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: unknown) => string);
    },
    duration = 4000
  ): Promise<T> => {
    const id = addToast(messages.loading, "pending");
    const activePromise = typeof promiseFn === "function" ? promiseFn() : promiseFn;

    try {
      const data = await activePromise;
      const successMessage = typeof messages.success === "function" 
        ? messages.success(data) 
        : messages.success;
        
      updateToast(id, { message: successMessage, type: "success", duration });
      return data;
    } catch (err) {
      const errorMessage = typeof messages.error === "function" 
        ? messages.error(err) 
        : messages.error;
        
      updateToast(id, { message: errorMessage, type: "error", duration });
      throw err;
    }
  }, [addToast, updateToast]);

  // Clean up all timers on provider unmount
  useEffect(() => {
    return () => {
      Object.values(timeouts.current).forEach(clearTimeout);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, dismissToast, updateToast, promise }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ─── HOOK FOR CLIENT COMPONENTS ───
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// ─── TOASTS CONTAINER (PORTAL/FIXED ELEMENT) ───
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div 
      className="fixed top-5 right-5 z-[9999] flex w-full max-w-sm flex-col gap-3 pointer-events-none"
      aria-live="assertive"
      aria-instant="true"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

// ─── TOAST INDIVIDUAL CARD ───
function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);

  // Trigger enter animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Map types to icons and colors matching the Stark-Modern theme
  const config = {
    pending: {
      icon: "sync",
      iconClass: "animate-spin text-tertiary",
      borderClass: "border-l-4 border-l-tertiary",
    },
    success: {
      icon: "check_circle",
      iconClass: "text-tertiary", // Pink tertiary accent used for success states to match theme
      borderClass: "border-l-4 border-l-tertiary",
    },
    error: {
      icon: "error",
      iconClass: "text-error",
      borderClass: "border-l-4 border-l-error",
    },
    info: {
      icon: "info",
      iconClass: "text-primary",
      borderClass: "border-l-4 border-l-primary",
    },
  }[toast.type];

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-xl transition-all duration-300 ease-out",
        config.borderClass,
        mounted 
          ? "translate-y-0 opacity-100 scale-100" 
          : "translate-y-[-16px] opacity-0 scale-95"
      )}
    >
      {/* Icon showing the status state */}
      <span className={cn("material-symbols-outlined shrink-0 text-[20px]", config.iconClass)}>
        {config.icon}
      </span>
      
      {/* Text message */}
      <p className="flex-1 font-label-md text-label-md leading-snug text-on-surface">
        {toast.message}
      </p>

      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-0.5 text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <Icon name="close" className="text-[16px]" />
      </button>
    </div>
  );
}
